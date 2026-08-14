import { Component, AfterViewInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from "@angular/router";

interface Star {
  startX: number;
  startY: number;
  radius: number;
  progress: number;
  progressSpeed: number;
}

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss'
})
export class MainComponent implements AfterViewInit, OnDestroy {
  private resizeListener?: () => void;
  private animationFrameId?: number;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.stars();
    }
  }

  stars(): void {
    const canvas = document.getElementById('scene') as HTMLCanvasElement;
    if (!canvas) return;

    const starArray: Star[] = [];
    this.setResizeListener(canvas, starArray);

    const ctx = canvas.getContext('2d')!;
    let lastTime = performance.now();

    const animate = () => {
      const currentTime = performance.now();
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // stars drift up by percentage of the screen height
      const moveDistance = canvas.height * 0.33;

      for (const star of starArray) {
        star.progress += star.progressSpeed * deltaTime;

        // reset the star progress when it completes its cycle
        if (star.progress >= 1) {
          star.progress = 0;
          star.startX = Math.floor(Math.random() * canvas.width);
          star.startY = Math.floor(Math.random() * canvas.height);
        }

        // fade in at the start, fade out at the end
        let currentOpacity = 1;
        if (star.progress < 0.1) {
          currentOpacity = star.progress * 10;
        } else if (star.progress > 0.9) {
          currentOpacity = (1 - star.progress) * 10;
        }

        const currentY = star.startY - (star.progress * moveDistance);

        ctx.fillStyle = `rgba(255, 255, 255, ${currentOpacity.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(star.startX, currentY, star.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      this.animationFrameId = requestAnimationFrame(animate);
    };

    animate();
  }

  private createStar(canvas: HTMLCanvasElement): Star {
    const sizeBase = Math.floor(Math.random() * 3) + 1;
    const durationMs = (16 + (Math.random() * 32)) * 1000; // animation takes min 16 and max 48 seconds

    return {
      startX: Math.floor(Math.random() * canvas.width),
      startY: Math.floor(Math.random() * canvas.height),
      radius: (1 + sizeBase) / 2,
      progress: Math.random(),
      progressSpeed: 1 / durationMs
    };
  }

  private setResizeListener(canvas: HTMLCanvasElement, starArray: Star[]): void {
    // set star density based on the new screen size
    this.resizeListener = () => {
      const oldWidth = canvas.width > 0 ? canvas.width : window.innerWidth;
      const oldHeight = canvas.height > 0 ? canvas.height : window.innerHeight;

      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;

      canvas.width = newWidth;
      canvas.height = newHeight;

      const targetCount = Math.floor((newWidth + newHeight) / 6);

      for (const star of starArray) {
        star.startX = (star.startX / oldWidth) * newWidth;
        star.startY = (star.startY / oldHeight) * newHeight;
      }

      while (starArray.length < targetCount) {
        starArray.push(this.createStar(canvas));
      }

      if (starArray.length > targetCount) {
        starArray.length = targetCount;
      }
    };

    this.resizeListener();
    window.addEventListener('resize', this.resizeListener);
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      if (this.resizeListener) {
        window.removeEventListener('resize', this.resizeListener);
      }
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
    }
  }
}