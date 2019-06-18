import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { PlacesService, FirebaseImageDataResponse } from '../../places.service';
import { LoadingController } from '@ionic/angular';
import { Router } from '@angular/router';
import { PlaceLocation } from '../../location.interface';
import { base64toBlob } from './base64ToBlob.utility';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-new-offer',
  templateUrl: './new-offer.page.html',
  styleUrls: ['./new-offer.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewOfferPage implements OnInit {
  form: FormGroup;
  dateToday: string;
  constructor(
    private placesService: PlacesService,
    private loadingCtrl: LoadingController,
    private router: Router
  ) {}

  get title() {
    return this.form.get('title');
  }
  get description() {
    return this.form.get('description');
  }
  get price() {
    return this.form.get('price');
  }
  get dateFrom() {
    return this.form.get('dateFrom');
  }
  get dateTo() {
    return this.form.get('dateTo');
  }
  get location() {
    return this.form.get('location');
  }
  get image() {
    return this.form.get('image');
  }

  ngOnInit() {
    this.dateToday = new Date().toISOString();
    this.form = new FormGroup({
      title: new FormControl(null, {
        updateOn: 'blur',
        validators: [Validators.required]
      }),
      description: new FormControl(null, {
        updateOn: 'blur',
        validators: [Validators.required, Validators.maxLength(140)]
      }),
      price: new FormControl(null, {
        updateOn: 'blur',
        validators: [Validators.required, Validators.min(1)]
      }),
      dateFrom: new FormControl(null, {
        updateOn: 'blur',
        validators: [Validators.required]
      }),
      dateTo: new FormControl(null, {
        updateOn: 'blur',
        validators: [Validators.required]
      }),
      location: new FormControl(null, {
        validators: [Validators.required]
      }),
      image: new FormControl(null, {
        validators: [Validators.required]
      })
    });
  }

  onCreateOffer() {
    if (!this.form.valid) {
      return;
    }
    // console.log('create new offer', this.form);
    const {
      title,
      description,
      image,
      price,
      dateFrom,
      dateTo,
      location
    } = this.form.value;
    console.log('creating new offer');

    this.loadingCtrl
      .create({
        message: 'Creating New Offer...'
      })
      .then(loadingEl => {
        loadingEl.present();
        // upload the image first
        this.placesService
          .uploadImage(this.form.value.image)
          .pipe(
            switchMap((firebaseResponse: FirebaseImageDataResponse) => {
              // call placeService to add the place offer
              return this.placesService.addPlace(
                title,
                description,
                firebaseResponse.imageUrl.normal,
                +price,
                new Date(dateFrom),
                new Date(dateTo),
                location,
                firebaseResponse.imageUrl.normal_fileName,
                firebaseResponse.imageUrl.small,
                firebaseResponse.imageUrl.small_fileName
              );
            })
          )
          .subscribe(() => {
            this.form.reset();
            loadingEl.dismiss();
            this.router.navigateByUrl('/places/tabs/offers');
          });
      });
  }

  onLocationChange(location: PlaceLocation) {
    // set the location data manually
    this.form.patchValue({
      location
    });
  }

  onImagePicked(imageData: string | File) {
    let image;
    if (typeof imageData === 'string') {
      // base64 image
      try {
        image = base64toBlob(
          imageData.replace('data:image/jpeg;base64,', ''),
          'image/jpeg'
        );
      } catch (e) {
        console.log(e);
        return;
      }
    } else {
      // normal file
      image = imageData;
    }

    this.form.patchValue({
      image
    });

    console.log(this.form);
  }
}
