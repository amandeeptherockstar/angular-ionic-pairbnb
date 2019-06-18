import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  Input
} from '@angular/core';
import {
  Plugins,
  Capacitor,
  CameraSource,
  CameraResultType
} from '@capacitor/core';
import { Platform } from '@ionic/angular';

@Component({
  selector: 'app-image-picker',
  templateUrl: './image-picker.component.html',
  styleUrls: ['./image-picker.component.scss']
})
export class ImagePickerComponent implements OnInit {
  base64Image: string;
  usePicker = false;
  // base64String Event Emitted for camera, for normal file selected Event will be A File
  // @Input() showPreview = false;
  @Input() imagePreviewUrl: string;
  @Output() imagePick = new EventEmitter<string | File>();
  @ViewChild('filePicker') filePickerRef: ElementRef<HTMLInputElement>;

  constructor(private platform: Platform) {}

  ngOnInit() {
    // console.log('Mobile ' + this.platform.is('mobile'));
    // console.log('Android ' + this.platform.is('android'));
    // console.log('IOS ' + this.platform.is('ios'));
    // console.log('Hybrid ' + this.platform.is('hybrid'));
    // console.log('Desktop ' + this.platform.is('desktop'));
    console.log('hoaosdasd');
    console.log(this.imagePreviewUrl);
    if (
      (this.platform.is('mobile') && !this.platform.is('hybrid')) ||
      this.platform.is('desktop')
    ) {
      //  mobile view on desktop gives us - (true && !false) || false
      // full view on chrome gives us - (false && !false) || true
      // on mobile devices - (true && !true) || false
      this.usePicker = true;
    }
  }

  async pickImage() {
    if (!Capacitor.isPluginAvailable('Camera') || this.usePicker) {
      console.log('BBOOMM');
      // plan B of Providing a File Picker
      this.filePickerRef.nativeElement.click();
      return;
    }

    console.log('SSHHHHHH');
    try {
      const image = await Plugins.Camera.getPhoto({
        correctOrientation: true,
        quality: 50,
        width: 600,
        source: CameraSource.Prompt,
        // we will choose base64 string and then we can convert it to an image easily
        resultType: CameraResultType.Base64
      });
      this.base64Image = image.base64String;
      // emit the photo as base 64 string
      this.imagePick.emit(image.base64String);
    } catch (e) {
      console.log(e);
    }
  }

  onFileChoosen(event: Event) {
    const file = (event.target as HTMLInputElement).files[0];
    if (!file) {
      // we dont have any file
      return;
    }
    const fileReader = new FileReader();
    // always define onload event before reading data
    fileReader.onload = () => {
      const imageAsBase64String = fileReader.result.toString();
      this.base64Image = imageAsBase64String;
      // emit the normal file
      this.imagePick.emit(file);
    };
    fileReader.readAsDataURL(file);
  }
}
