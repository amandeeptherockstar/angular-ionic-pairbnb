import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  ModalController,
  ActionSheetController,
  LoadingController,
  AlertController
} from '@ionic/angular';
import { CreateBookingComponent } from 'src/app/our-bookings/create-booking/create-booking.component';
import { Place } from '../../place.model';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { PlacesService } from '../../places.service';
import { Subscription } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
import { OurBookingService } from './../../../our-bookings/our-booking.service';
import { OverlayEventDetail } from '@ionic/core';
import { AuthService } from 'src/app/auth/auth.service';
import { MapmodalComponent } from 'src/app/shared/mapmodal/mapmodal.component';

@Component({
  selector: 'app-place-detail',
  templateUrl: './place-detail.page.html',
  styleUrls: ['./place-detail.page.scss']
})
export class PlaceDetailPage implements OnInit, OnDestroy {
  place: Place;
  placeId: string;
  isBookable = false;
  private paramMapSubscription: Subscription;
  isLoading = false;

  constructor(
    private modalCtrl: ModalController,
    private route: ActivatedRoute,
    private placesService: PlacesService,
    private bookingService: OurBookingService,
    private authService: AuthService,
    private actionSheetCtrl: ActionSheetController,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private router: Router
  ) {}

  ngOnInit() {
    // this.placeId = this.route.snapshot.params['placeId'];

    // use this way if you want to use paramMap way
    // dont ever use subscribe inside another subscribe method
    // thats why here i have used switchMap Operator
    this.isLoading = true;
    let placeResult: Place;
    this.paramMapSubscription = this.route.paramMap
      .pipe(
        switchMap((paramMap: ParamMap) => {
          this.placeId = paramMap.get('placeId');
          return this.placesService.getPlace(this.placeId);
        }),
        switchMap((place: Place) => {
          placeResult = place;
          return this.authService.userId;
        }),
        take(1)
      )
      .subscribe(
        (userId: string) => {
          this.place = placeResult;
          this.isBookable = userId !== this.place.userId;
          this.isLoading = false;
          // console.log(this.isBookable);
        },
        err => {
          this.alertCtrl
            .create({
              header: 'Something went wrong!',
              message:
                'The Place with given id was not found! Please try again.',
              buttons: [
                {
                  text: 'Okay',
                  handler: () => {
                    this.router.navigateByUrl('/places/tabs/discover');
                  }
                }
              ]
            })
            .then(alertEl => {
              alertEl.present();
            });
          console.log('Something went wrong');
        }
      );

    // or use this way if you want to use snapshot way
    // this.placeId = this.route.snapshot.params['placeId'];
    // this.placesService.getPlace(this.placeId)
    // .subscribe((place: Place) => {
    //   this.place = place;
    // });
  }

  goBack() {
    // this.navCtrl.navigateBack('/places/tabs/discover');
  }

  onBookPlace() {
    this.actionSheetCtrl
      .create({
        header: 'Choose An Action',
        buttons: [
          {
            text: 'Select Date',
            handler: () => this.openBookingModal('select')
          },
          {
            text: 'Random Date',
            handler: () => this.openBookingModal('random')
          },
          { text: 'Cancel', role: 'cancel' }
        ]
      })
      .then((actionEl: HTMLIonActionSheetElement) => actionEl.present());
  }

  ngOnDestroy() {
    if (this.paramMapSubscription) {
      this.paramMapSubscription.unsubscribe();
    }
  }

  private openBookingModal(mode: 'select' | 'random') {
    this.modalCtrl
      .create({
        component: CreateBookingComponent,
        componentProps: { selectedPlace: this.place, selectedMode: mode }
      })
      .then(modal => {
        modal.present();
        return modal.onDidDismiss();
      })
      .then(response => {
        console.log(response.data, response.role);
        if (response.role === 'confirm') {
          return this.loadingCtrl
            .create({
              message: 'Creating Booking...'
            })
            .then(loadingCtrl => {
              loadingCtrl.present();
              const {
                firstname,
                lastname,
                guests,
                startdate,
                enddate
              } = response.data.bookingData;

              this.bookingService
                .addBooking(
                  this.placeId,
                  this.place.title,
                  this.place.imageUrl,
                  firstname,
                  lastname,
                  +guests,
                  new Date(startdate),
                  new Date(enddate)
                )
                .subscribe(() => {
                  loadingCtrl.dismiss();
                });
            });
        }
      });
  }

  openMapModal() {
    this.modalCtrl
      .create({
        component: MapmodalComponent,
        componentProps: {
          lat: this.place.location.lat,
          lng: this.place.location.lng,
          address: this.place.location.address,
          viewOnlyMode: true
        }
      })
      .then(modalEl => {
        modalEl.present();
      });
  }
}
