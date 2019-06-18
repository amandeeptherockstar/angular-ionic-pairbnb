import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { LocationPickerComponent } from './picker/location-picker/location-picker.component';
import { MapmodalComponent } from './mapmodal/mapmodal.component';
import { ImagePickerComponent } from './picker/image-picker/image-picker.component';

@NgModule({
  declarations: [
    LocationPickerComponent,
    MapmodalComponent,
    ImagePickerComponent
  ],
  exports: [LocationPickerComponent, MapmodalComponent, ImagePickerComponent],
  imports: [CommonModule, IonicModule],
  entryComponents: [MapmodalComponent]
})
export class SharedModule {}
