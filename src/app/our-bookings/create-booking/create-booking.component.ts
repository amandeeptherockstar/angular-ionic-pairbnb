import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { Place } from 'src/app/places/place.model';
import { ModalController, IonDatetime } from '@ionic/angular';
import { NgForm } from '@angular/forms';
import { DatetimeChangeEventDetail } from '@ionic/core';

@Component({
  selector: 'app-create-booking',
  templateUrl: './create-booking.component.html',
  styleUrls: ['./create-booking.component.scss']
})
export class CreateBookingComponent implements OnInit {
  @Input('selectedPlace') selectedPlace: Place;
  @Input('selectedMode') selectedMode: 'random' | 'select';

  @ViewChild('startDateCtrl') startDateCtrl: IonDatetime;
  @ViewChild('endDateCtrl') endDateCtrl: IonDatetime;

  isStartAndEndDateValid = false;
  startDate: string;
  endDate: string;

  constructor(private modalCtrl: ModalController) {}

  ngOnInit() {
    const availableFrom = this.selectedPlace.availableFrom;
    const availableTo = this.selectedPlace.availableTo;
    // console.log(availableFrom);
    // console.log(availableTo);
    // console.log(this.selectedMode + ' MODE');
    if (this.selectedMode === 'random') {
      this.startDate = new Date(
        availableFrom.getTime() +
          Math.random() *
            (availableTo.getTime() -
              7 * 24 * 60 * 60 * 1000 -
              availableFrom.getTime())
      ).toISOString();

      this.endDate = new Date(
        new Date(this.startDate).getTime() +
          Math.random() *
            (new Date(this.startDate).getTime() +
              6 * 24 * 60 * 60 * 1000 -
              new Date(this.startDate).getTime())
      ).toISOString();

      // set the isStartAndEndDateValid to true
      this.isStartAndEndDateValid = true;
    }
  }

  dateChange(event, date: 'from' | 'to') {
    // console.log(this.startDateCtrl.value);
    // console.log(event, 'TODATE');
    let startDate, endDate;
    if (date === 'from') {
      startDate = new Date(event.detail.value);
      endDate = new Date(this.endDateCtrl.value);
    } else {
      startDate = new Date(this.startDateCtrl.value);
      endDate = new Date(event.detail.value);
    }

    console.log(startDate, endDate);
    this.isStartAndEndDateValid = endDate > startDate;
    console.log(this.isStartAndEndDateValid);
  }

  onSubmit(form: NgForm) {
    console.log(form);
    console.log({
      firstname: form.value.firstName,
      lastname: form.value.lastName,
      guests: form.value.guests,
      startdate: form.value.dateFrom,
      enddate: form.value.dateTo
    });
    this.modalCtrl.dismiss(
      {
        bookingData: {
          firstname: form.value.firstName,
          lastname: form.value.lastName,
          guests: form.value.guests,
          startdate: form.value.dateFrom,
          enddate: form.value.dateTo
        }
      },
      'confirm'
    );
  }

  cancel() {
    this.modalCtrl.dismiss(null, 'cancel');
  }
}
