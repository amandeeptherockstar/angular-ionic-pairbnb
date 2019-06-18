import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { Place } from '../place.model';
import { PlacesService } from '../places.service';
import { IonItemSliding } from '@ionic/angular';
import { Subscription, of } from 'rxjs';
import { take, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-offers',
  templateUrl: './offers.page.html',
  styleUrls: ['./offers.page.scss']
})
export class OffersPage implements OnInit, OnDestroy {
  places: Place[] = [];
  placesSubscription: Subscription;
  isLoading = false;

  constructor(
    private placesService: PlacesService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.placesSubscription = this.placesService.places.subscribe(
      (places: Place[]) => {
        this.places = places;
      }
    );
  }

  ionViewWillEnter() {
    this.isLoading = true;
    this.placesService.places
      .pipe(
        take(1),
        switchMap((places: Place[]) => {
          // only fetch the places if there are no places inside the service
          // so that on every page load we stop fetching the data from the firebase server
          if (places.length <= 0) {
            return this.placesService.fetchPlaces();
          } else {
            return of(null);
          }
        })
      )
      .subscribe(() => {
        this.isLoading = false;
      });
  }

  edit(id: string, slidingItem: IonItemSliding) {
    console.log('edit');
    slidingItem.close();
    this.router.navigate(['./', 'edit', id], { relativeTo: this.route });
  }

  ngOnDestroy() {
    if (this.placesSubscription) {
      this.placesSubscription.unsubscribe();
    }
  }
}
