import { Component, OnInit, OnDestroy } from '@angular/core';
import { OurBooking } from './our-booking.model';
import { OurBookingService } from './our-booking.service';
import { Subscription } from 'rxjs';
import { LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-our-bookings',
  templateUrl: './our-bookings.page.html',
  styleUrls: ['./our-bookings.page.scss']
})
export class OurBookingsPage implements OnInit, OnDestroy {
  bookings: OurBooking[] = [];
  bookingsSubscription: Subscription;

  isLoading = false;

  constructor(
    private bookingService: OurBookingService,
    private loadingController: LoadingController
  ) {}

  ngOnInit() {
    this.bookingsSubscription = this.bookingService.bookings.subscribe(
      (bookings: OurBooking[]) => {
        this.bookings = bookings;
      }
    );
  }

  ionViewWillEnter() {
    this.isLoading = true;
    this.bookingService.fetchBookings().subscribe(() => {
      this.isLoading = false;
    });
  }

  deleteBooking(bookingId: string) {
    console.log('Delete ' + bookingId);
    this.loadingController
      .create({
        message: 'Deleting Booking...'
      })
      .then(loadingController => {
        loadingController.present();
        this.bookingService.cancelBooking(bookingId).subscribe(() => {
          loadingController.dismiss();
        });
      });
  }

  ngOnDestroy() {
    if (this.bookingsSubscription) {
      this.bookingsSubscription.unsubscribe();
    }
  }
}
