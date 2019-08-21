import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DrawerComponent, DrawerServiceComponent } from './drawer.component';

@NgModule({
  imports: [CommonModule],
  declarations: [DrawerComponent, DrawerServiceComponent],
  exports: [DrawerComponent, DrawerServiceComponent],
  entryComponents: [DrawerServiceComponent],
})
export class DrawerModule {}
