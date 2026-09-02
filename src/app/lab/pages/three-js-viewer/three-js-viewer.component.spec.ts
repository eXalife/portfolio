import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ThreeJsViewerComponent } from './three-js-viewer.component';
import { LayoutService } from '../../service/layout.service';
import { signal, WritableSignal } from '@angular/core';
import * as THREE from 'three';

class MockLayoutService {
  loading: WritableSignal<boolean> = signal(false);
}

describe('ThreeJsViewerComponent', () => {
  let component: ThreeJsViewerComponent;
  let fixture: ComponentFixture<ThreeJsViewerComponent>;
  let mockLayoutService: MockLayoutService;

  beforeAll(() => {
    (window as any).ResizeObserver = class {
      observe() { }
      unobserve() { }
      disconnect() { }
    };
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThreeJsViewerComponent],
      providers: [
        { provide: LayoutService, useClass: MockLayoutService }
      ]
    }).compileComponents();

    mockLayoutService = TestBed.inject(LayoutService) as unknown as MockLayoutService;
    fixture = TestBed.createComponent(ThreeJsViewerComponent);
    component = fixture.componentInstance;

    spyOn<any>(component, 'initThreeJs').and.stub();
    spyOn(component, 'loadModel').and.stub();

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Navigation Logic', () => {
    it('should navigate to the next model and update the index', () => {
      component.currentIndex.set(0);
      component.nextModel();

      expect(component.currentIndex()).toBe(1);
      expect(component.currentModel().name).toBe('The Great Drawing Room');
      expect(component.loadModel).toHaveBeenCalledWith(component.modelList[1]);
    });

    it('should wrap around to the first model when calling nextModel from the last item', () => {
      component.currentIndex.set(component.modelList.length - 1);
      component.nextModel();

      expect(component.currentIndex()).toBe(0);
      expect(component.loadModel).toHaveBeenCalledWith(component.modelList[0]);
    });

    it('should navigate to the previous model and update the index', () => {
      component.currentIndex.set(1);
      component.prevModel();

      expect(component.currentIndex()).toBe(0);
      expect(component.loadModel).toHaveBeenCalledWith(component.modelList[0]);
    });

    it('should wrap around to the last model when calling prevModel from the first item', () => {
      component.currentIndex.set(0);
      component.prevModel();

      expect(component.currentIndex()).toBe(component.modelList.length - 1);
      expect(component.loadModel).toHaveBeenCalledWith(component.modelList[component.modelList.length - 1]);
    });

    it('should NOT navigate if the component is currently loading', () => {
      mockLayoutService.loading.set(true);
      component.currentIndex.set(0);

      (component.loadModel as jasmine.Spy).calls.reset();

      component.nextModel();
      component.prevModel();

      expect(component.currentIndex()).toBe(0);
      expect(component.loadModel).not.toHaveBeenCalled();
    });
  });

  describe('Model Loading', () => {
    beforeEach(() => {
      (component.loadModel as jasmine.Spy).and.callThrough();
      (component as any).scene = new THREE.Scene();
      (component as any).camera = new THREE.PerspectiveCamera();

      (component as any).controls = {
        target: new THREE.Vector3(),
        update: jasmine.createSpy('update'),
        dispose: jasmine.createSpy('dispose')
      };

      spyOn<any>(component, 'disposeCurrentModel').and.stub();
    });

    it('should set loading state to true and delegate to GLTFLoader', () => {
      const gltfLoaderSpy = spyOn((component as any).gltfLoader, 'load').and.stub();

      component.loadModel(component.modelList[0]);

      expect(mockLayoutService.loading()).toBeTrue();
      expect((component as any).activeLoadingPath).toBe(component.modelList[0].path);
      expect(gltfLoaderSpy).toHaveBeenCalledWith(
        component.modelList[0].path,
        jasmine.any(Function),
        undefined,
        jasmine.any(Function)
      );
    });

    it('should handle GLTFLoader success callback', fakeAsync(() => {
      const mockGltf = {
        scene: new THREE.Group(),
        animations: []
      };

      spyOn((component as any).gltfLoader, 'load').and.callFake(
        (url: string, onLoad: Function) => {
          onLoad(mockGltf);
        }
      );

      const sceneAddSpy = spyOn((component as any).scene, 'add').and.callThrough();

      component.loadModel(component.modelList[0]);
      tick();

      expect((component as any).disposeCurrentModel).toHaveBeenCalled();
      expect(sceneAddSpy).toHaveBeenCalledWith(mockGltf.scene);
      expect((component as any).currentSceneModel).toBe(mockGltf.scene);
      expect(mockLayoutService.loading()).toBeFalse();
    }));

    it('should handle GLTFLoader error callback', fakeAsync(() => {
      const consoleSpy = spyOn(console, 'error');

      spyOn((component as any).gltfLoader, 'load').and.callFake(
        (url: string, onLoad: Function, onProgress: Function, onError: Function) => {
          onError(new Error('Network Error'));
        }
      );

      component.loadModel(component.modelList[0]);
      tick();

      expect(consoleSpy).toHaveBeenCalledWith('Error loading GLTF:', jasmine.any(Error));
      expect(mockLayoutService.loading()).toBeFalse();
    }));
  });

  describe('Cleanup on Destroy', () => {
    it('should cleanly dispose of Three.js resources on ngOnDestroy', () => {
      const disposeSpy = spyOn<any>(component, 'disposeCurrentModel').and.stub();
      const dracoDisposeSpy = spyOn((component as any).dracoLoader, 'dispose').and.stub();

      component.ngOnDestroy();

      expect(disposeSpy).toHaveBeenCalled();
      expect(dracoDisposeSpy).toHaveBeenCalled();
      expect(mockLayoutService.loading()).toBeFalse();
    });
  });
});