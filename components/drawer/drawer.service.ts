import { Injectable, ComponentRef } from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { DrawerServiceComponent } from './drawer.component';
import { DrawerOptions } from './drawer-options';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

export class DrawerBuilderForService<R> {
  private drawerRef: ComponentRef<DrawerServiceComponent>;
  private overlayRef: OverlayRef;
  private unsubscribe$ = new Subject<void>();

  constructor(private overlay: Overlay, private options: DrawerOptions) {
    this.createDrawer();
    this.updateOptions(this.options);
    this.drawerRef.instance.onViewInit.pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
      this.drawerRef.instance.update();
      this.drawerRef.instance.open = true;
    });

    this.drawerRef.instance.afterClose.pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
      this.overlayRef.dispose();
      this.drawerRef = null;
      this.unsubscribe$.next();
      this.unsubscribe$.complete();
    });
  }

  getInstance(): DrawerServiceComponent {
    return this.drawerRef && this.drawerRef.instance;
  }

  createDrawer(): void {
    this.overlayRef = this.overlay.create();
    this.drawerRef = this.overlayRef.attach(new ComponentPortal(DrawerServiceComponent));
  }

  updateOptions(options: DrawerOptions): void {
    Object.assign(this.drawerRef.instance, options);
  }
}

@Injectable({ providedIn: 'root' })
@Injectable()
export class Drawer {
  instances: DrawerServiceComponent[] = [];

  constructor(private overlay: Overlay) {}

  // tslint:disable-next-line:no-any
  create<T = any, D = any, R = any>(options: DrawerOptions): DrawerServiceComponent {
    const instance = new DrawerBuilderForService<R>(this.overlay, options).getInstance();
    this.instances = this.instances.filter(x => x !== null || x !== undefined);
    this.instances.push(instance);
    return instance;
  }

  closeAll() {
    this.instances = this.instances.filter(x => x !== null || x !== undefined);
    this.instances.forEach(x => {
      x.open = false;
    });
    this.instances = [];
  }
}
