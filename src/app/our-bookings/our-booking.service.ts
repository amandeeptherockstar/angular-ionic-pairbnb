import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { take, tap, switchMap, map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

import { OurBooking } from './our-booking.model';
import { AuthService } from '../auth/auth.service';
import { OurFirebaseBooking } from './our-booking.interface';

@Injectable({
  providedIn: 'root'
})
export class OurBookingService {
  private _bookings = new BehaviorSubject<OurBooking[]>([]);

  constructor(private authService: AuthService, private http: HttpClient) {}

  get bookings() {
    return this._bookings.asObservable();
  }

  fetchBookings() {
    let userId: string;
    return this.authService.userId.pipe(
      take(1),
      switchMap((userid: string) => {
        if (!userid) {
          throw new Error('User id not found');
        }
        userId = userid;
        return this.authService.token;
      }),
      take(1),
      switchMap(token => {
        return this.http.get<{ [key: string]: OurFirebaseBooking }>(
          `https://pairbnb-ionic-course.firebaseio.com/bookings.json?orderBy="userId"&equalTo="${userId}"&auth=${token}`
        );
      }),
      map(firebaseResponse => {
        console.log(firebaseResponse);
        let bookings: OurBooking[] = [];
        for (let key in firebaseResponse) {
          if (firebaseResponse.hasOwnProperty(key)) {
            bookings.push(
              new OurBooking(
                key,
                firebaseResponse[key].placeId,
                firebaseResponse[key].userId,
                firebaseResponse[key].placeTitle,
                firebaseResponse[key].placeImage,
                firebaseResponse[key].userFirstName,
                firebaseResponse[key].userLastName,
                +firebaseResponse[key].noOfGuests,
                new Date(firebaseResponse[key].bookFrom),
                new Date(firebaseResponse[key].bookTo)
              )
            );
          }
        }
        return bookings;
      }),
      tap((bookings: OurBooking[]) => {
        this._bookings.next(bookings);
      })
    );
  }

  addBooking(
    placeId: string,
    placeTitle: string,
    placeImage: string,
    firstName: string,
    lastName: string,
    noOfGuests: number,
    bookFrom: Date,
    bookTo: Date
  ) {
    let generatedId: string;
    let fbNewBooking: OurFirebaseBooking;
    return this.authService.userId.pipe(
      take(1),
      switchMap(userid => {
        if (!userid) {
          throw new Error('No user id found');
        }
        fbNewBooking = {
          placeId,
          userId: userid,
          placeTitle,
          placeImage,
          userFirstName: firstName,
          userLastName: lastName,
          noOfGuests,
          bookFrom,
          bookTo
        };
        return this.authService.token;
      }),
      take(1),
      switchMap(token => {
        return this.http.post<{ name: string }>(
          `https://pairbnb-ionic-course.firebaseio.com/bookings.json?auth=$${token}`,
          fbNewBooking
        );
      }),
      switchMap(firebaseResponse => {
        generatedId = firebaseResponse.name;
        return this.bookings;
      }),
      take(1),
      tap((bookings: OurBooking[]) => {
        const newBooking = new OurBooking(
          generatedId,
          placeId,
          fbNewBooking.userId,
          placeTitle,
          placeImage,
          firstName,
          lastName,
          noOfGuests,
          bookFrom,
          bookTo
        );
        // raise an add event on the behavior subject
        this._bookings.next(bookings.concat(newBooking));
      })
    );

    // return this.bookings.pipe(
    //   take(1),
    //   delay(1000),
    //   tap((bookings: OurBooking[]) => {
    //     this._bookings.next(bookings.concat(newBooking));
    //   })
    // );
  }

  cancelBooking(bookingId: string) {
    return this.authService.token.pipe(
      take(1),
      switchMap(token => {
        return this.http.delete(
          `https://pairbnb-ionic-course.firebaseio.com/bookings/${bookingId}.json?auth=${token}`
        );
      }),
      switchMap(() => {
        return this.bookings;
      }),
      take(1),
      tap((bookings: OurBooking[]) => {
        const filterBookings = bookings.filter(
          booking => booking.id !== bookingId
        );
        this._bookings.next(filterBookings);
      })
    );

    // return this.bookings.pipe(
    //   take(1),
    //   delay(1000),
    //   tap((bookings: OurBooking[]) => {
    //     const filterBookings = bookings.filter(
    //       booking => booking.id !== bookingId
    //     );
    //     this._bookings.next(filterBookings);
    //   })
    // );
  }
}
