import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DrawerComponent, DrawerServiceComponent } from './drawer.component';
import { DrawerService } from './drawer.service';

@NgModule({
  imports: [CommonModule],
  declarations: [DrawerComponent, DrawerServiceComponent],
  exports: [DrawerComponent, DrawerServiceComponent],
  entryComponents: [DrawerServiceComponent],
  providers: [DrawerService]
})
export class DrawerModule {}
