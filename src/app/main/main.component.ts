import { Component, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss'
})
export class MainComponent implements AfterViewInit {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.stars();
    }
  }

  stars(): void {
    const canvas = document.getElementById('scene') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;

    interface Star {
      startX: number;
      startY: number;
      radius: number;
      progress: number;
      progressSpeed: number;
    }

    const starArray: Star[] = [];

    function createStar(): Star {
      const sizeBase = Math.floor(Math.random() * 3) + 1;
      const durationMs = (10 + (Math.random() * 20)) * 1000;

      return {
        startX: Math.floor(Math.random() * canvas.width),
        startY: Math.floor(Math.random() * canvas.height),
        radius: (1 + sizeBase) / 2,
        progress: Math.random(),
        progressSpeed: 1 / durationMs
      };
    }

    function resize() {
      const oldWidth = canvas.width > 0 ? canvas.width : window.innerWidth;
      const oldHeight = canvas.height > 0 ? canvas.height : window.innerHeight;

      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;

      canvas.width = newWidth;
      canvas.height = newHeight;

      // Calculate star density based on combined window dimensions
      const targetCount = Math.floor((newWidth + newHeight) / 6);

      // Scale existing star coordinates to maintain relative positions across resizes
      for (let i = 0; i < starArray.length; i++) {
        const star = starArray[i];
        star.startX = (star.startX / oldWidth) * newWidth;
        star.startY = (star.startY / oldHeight) * newHeight;
      }

      // Populate missing stars if window expanded
      while (starArray.length < targetCount) {
        starArray.push(createStar());
      }

      // Trim excess stars if window contracted
      if (starArray.length > targetCount) {
        starArray.length = targetCount;
      }
    }

    resize();
    window.addEventListener('resize', resize);

    let lastTime = performance.now();

    function animate() {
      const currentTime = performance.now();
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Maximum vertical drift distance (20%)
      const moveDistance = canvas.height * 0.2;

      for (let i = 0; i < starArray.length; i++) {
        const star = starArray[i];

        star.progress += star.progressSpeed * deltaTime;

        // Reset star lifecycle and generate new coordinates when complete
        if (star.progress >= 1) {
          star.progress = 0;
          star.startX = Math.floor(Math.random() * canvas.width);
          star.startY = Math.floor(Math.random() * canvas.height);
        }

        // Calculate opacity: fade in (0-10%) and fade out (90-100%)
        let currentOpacity = 1;
        if (star.progress < 0.1) {
          currentOpacity = star.progress * 10;
        } else if (star.progress > 0.9) {
          currentOpacity = (1 - star.progress) * 10;
        }

        // Calculate current vertical position based on progress
        const currentY = star.startY - (star.progress * moveDistance);

        ctx.fillStyle = `rgba(255, 255, 255, ${currentOpacity.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(star.startX, currentY, star.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      requestAnimationFrame(animate);
    }

    animate();
  }
}