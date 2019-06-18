import { Component, OnInit, OnDestroy } from '@angular/core';
import { SegmentChangeEventDetail } from '@ionic/core';
import { Subscription, of } from 'rxjs';

import { PlacesService } from '../places.service';
import { Place } from '../place.model';
import { AuthService } from 'src/app/auth/auth.service';
import { take, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-discover',
  templateUrl: './discover.page.html',
  styleUrls: ['./discover.page.scss']
})
export class DiscoverPage implements OnInit, OnDestroy {
  isLoading = false;
  places: Place[] = [];
  highlightedPlace: Place;
  relevantPlaces: Place[] = [];
  selectedSegment = 'all';

  placesSubscription: Subscription;

  constructor(
    private placesService: PlacesService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.placesSubscription = this.placesService.places.subscribe(
      (places: Place[]) => {
        this.places = places;
        this.highlightedPlace = this.places[0];
        this.relevantPlaces = [...this.places].slice(1);
        //   console.log(this.relevantPlaces);
        //   console.log(this.highlightedPlace);
        //   console.log(this.places);
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

  onSegmentChange(e: CustomEvent<SegmentChangeEventDetail>) {
    console.log(e.detail);
    if (e.detail.value === 'all') {
      this.selectedSegment = 'all';
      this.relevantPlaces = this.places.slice(1);
      this.highlightedPlace = this.places[0];
    } else {
      this.authService.userId.pipe(take(1)).subscribe(userid => {
        if (!userid) {
          throw new Error('User id not found');
        }

        this.selectedSegment = 'bookable';
        this.relevantPlaces = this.places.filter(
          place => place.userId !== userid
        );
        if (this.relevantPlaces.length > 0) {
          this.highlightedPlace = this.relevantPlaces[0];
          this.relevantPlaces = this.relevantPlaces.slice(1);
        } else {
          this.highlightedPlace = null;
          this.relevantPlaces = [];
        }
      });
    }
  }

  ngOnDestroy() {
    if (this.placesSubscription) {
      this.placesSubscription.unsubscribe();
    }
  }
}
