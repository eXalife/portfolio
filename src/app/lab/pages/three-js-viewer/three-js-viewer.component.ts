import { afterNextRender, Component, computed, ElementRef, inject, NgZone, OnDestroy, signal, ViewChild } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { LayoutService } from '../../service/layout.service';

interface ModelItem {
  name: string;
  path: string;
  license: string;
  link: string;
  isInterior?: boolean;
}

@Component({
  selector: 'app-three-js-viewer',
  standalone: true,
  imports: [],
  templateUrl: './three-js-viewer.component.html',
  styleUrl: './three-js-viewer.component.scss'
})
export class ThreeJsViewerComponent implements OnDestroy {
  @ViewChild('canvasContainer') private containerRef!: ElementRef<HTMLDivElement>;
  private layoutService = inject(LayoutService);
  private ngZone = inject(NgZone);

  readonly loading = this.layoutService.loading;

  readonly modelList: ModelItem[] = [
    {
      name: 'Medieval Fantasy Book',
      path: 'assets/lab/threejs/medieval_fantasy_book.glb',
      license: '"Medieval Fantasy Book" by Pixel (CC BY 4.0)',
      link: 'https://skfb.ly/69Qty'
    },
    {
      name: 'The Great Drawing Room',
      path: 'assets/lab/threejs/the_great_drawing_room.glb',
      license: '"The Great Drawing Room" by Hallwylska museet (CC BY 4.0)',
      link: 'https://skfb.ly/6ypJL',
      isInterior: true
    },
    {
      name: 'Littlest Tokyo',
      path: 'assets/lab/threejs/LittlestTokyo.glb',
      license: '"Littlest Tokyo" by Glen Fox (CC BY 4.0)',
      link: 'https://artstation.com/artwork/1AGwX'
    }
  ];

  readonly currentIndex = signal<number>(0);
  readonly currentModel = computed(() => this.modelList[this.currentIndex()]);

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private controls!: OrbitControls;
  private mixer?: THREE.AnimationMixer;
  private currentSceneModel?: THREE.Group;
  private resizeObserver?: ResizeObserver;
  private animationFrameId: number | null = null;
  private clock = new THREE.Clock();
  private activeLoadingPath: string | null = null;

  private dracoLoader = new DRACOLoader().setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
  private gltfLoader = new GLTFLoader().setDRACOLoader(this.dracoLoader);

  constructor() {
    afterNextRender(() => {
      this.initThreeJs();
      this.loadModel(this.currentModel());
    });
  }

  nextModel(): void {
    if (this.loading()) return;
    const nextIdx = (this.currentIndex() + 1) % this.modelList.length;
    this.currentIndex.set(nextIdx);
    this.loadModel(this.modelList[nextIdx]);
  }

  prevModel(): void {
    if (this.loading()) return;
    const prevIdx = (this.currentIndex() - 1 + this.modelList.length) % this.modelList.length;
    this.currentIndex.set(prevIdx);
    this.loadModel(this.modelList[prevIdx]);
  }

  private initThreeJs(): void {
    const container = this.containerRef.nativeElement;
    const width = container.clientWidth || 1;
    const height = container.clientHeight || 1;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, logarithmicDepthBuffer: true });
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.8;
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.33;

    this.scene.add(new THREE.AmbientLight(0xffffff, 1.5));
    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(5, 10, 7);
    this.scene.add(dirLight);

    this.resizeObserver = new ResizeObserver(([entry]) => {
      const { width: w, height: h } = entry.contentRect;
      if (w === 0 || h === 0) return;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });
    this.resizeObserver.observe(container);

    this.ngZone.runOutsideAngular(() => {
      this.controls.addEventListener('start', () => {
        if (this.controls) this.controls.autoRotate = false;
      });

      const animate = () => {
        this.animationFrameId = requestAnimationFrame(animate);

        if (this.mixer) {
          this.mixer.update(this.clock.getDelta());
        }
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
      };

      animate();
    });
  }

  loadModel(modelItem: ModelItem): void {
    this.loading.set(true);
    this.activeLoadingPath = modelItem.path;

    this.gltfLoader.load(
      modelItem.path,
      (gltf) => {
        if (this.activeLoadingPath !== modelItem.path) return;

        try {
          this.disposeCurrentModel();

          const model = gltf.scene;
          this.currentSceneModel = model;
          this.scene.add(model);

          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z) || 1;
          const minDim = Math.min(size.x, size.y, size.z) || 0.1;

          this.controls.target.copy(center);

          if (modelItem.isInterior) {
            this.controls.minDistance = 0.1;
            this.controls.maxDistance = Math.min(size.x, size.z) * 0.15;

            this.camera.position.set(
              center.x,
              center.y,
              center.z + this.controls.maxDistance * 0.75
            );
          } else {
            const vFov = (this.camera.fov * Math.PI) / 180;
            const aspect = this.camera.aspect || 1;
            const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);

            const distV = (maxDim / 2) / Math.tan(vFov / 2);
            const distH = (maxDim / 2) / Math.tan(hFov / 2);
            const fitDistance = Math.max(distV, distH) * 1.25;

            this.controls.minDistance = fitDistance * 0.3;
            this.controls.maxDistance = fitDistance * 3.0;

            this.camera.position.set(
              center.x,
              center.y + fitDistance * 0.2,
              center.z + fitDistance
            );
          }

          this.camera.near = Math.max(minDim * 0.001, 0.01);
          this.camera.far = Math.max(maxDim * 10, 100);
          this.camera.updateProjectionMatrix();

          this.controls.autoRotate = true;
          this.controls.update();

          if (gltf.animations && gltf.animations.length > 0) {
            this.mixer = new THREE.AnimationMixer(model);
            gltf.animations.forEach((clip) => {
              this.mixer!.clipAction(clip).play();
            });
          }
        } catch (err) {
          console.error('Error during model initialization:', err);
        } finally {
          this.ngZone.run(() => {
            if (this.activeLoadingPath === modelItem.path) {
              this.loading.set(false);
            }
          });
        }
      },
      undefined,
      (error) => {
        console.error('Error loading GLTF:', error);
        this.ngZone.run(() => {
          if (this.activeLoadingPath === modelItem.path) {
            this.loading.set(false);
          }
        });
      }
    );
  }

  private disposeCurrentModel(): void {
    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer = undefined;
    }

    if (!this.currentSceneModel) return;

    this.scene.remove(this.currentSceneModel);

    this.currentSceneModel.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.geometry?.dispose();

        const disposeMaterial = (mat: THREE.Material) => {
          for (const key of Object.keys(mat)) {
            const val = (mat as Record<string, any>)[key];
            if (val && typeof val === 'object' && val.isTexture) {
              val.dispose();
            }
          }
          mat.dispose();
        };

        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(disposeMaterial);
        } else if (mesh.material) {
          disposeMaterial(mesh.material);
        }
      }
    });

    this.currentSceneModel = undefined;
  }

  ngOnDestroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    if (this.resizeObserver && this.containerRef?.nativeElement) {
      this.resizeObserver.unobserve(this.containerRef.nativeElement);
    }
    this.resizeObserver?.disconnect();

    this.disposeCurrentModel();
    this.dracoLoader.dispose();
    this.controls?.dispose();
    this.renderer?.dispose();
    this.renderer?.domElement.remove();

    if (this.scene?.environment) {
      this.scene.environment.dispose();
    }

    this.loading.set(false);
  }
}