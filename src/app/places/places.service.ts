import { Injectable } from '@angular/core';
import { Place } from './place.model';
import { AuthService } from '../auth/auth.service';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { take, map, tap, delay, switchMap, catchError } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FirebasePlace } from './place.interface';
import { PlaceLocation } from './location.interface';

export interface FirebaseImageDataResponse {
  message: string;
  imageUrl: {
    small: string;
    small_fileName: string;
    normal: string;
    normal_fileName: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PlacesService {
  private _places = new BehaviorSubject<Place[]>([]);

  // [
  //   new Place(
  //     'p1',
  //     'Manhattan Mension',
  //     'In the heart of New York city.',
  //     'https://imgs.6sqft.com/wp-content/uploads/2014/06/21042533/Carnegie-Mansion-nyc.jpg',
  //     149.99,
  //     new Date('2019-01-01'),
  //     new Date('2019-12-31'),
  //     'abc'
  //   ),
  //   new Place(
  //     'p2',
  //     'LAmour Toujours',
  //     'A romantic place in Paris.',
  //     'https://www.zindagihomes.com/img/article_8474601931517368433.jpg',
  //     89.99,
  //     new Date('2017-06-01'),
  //     new Date('2019-06-30'),
  //     'xyz'
  //   ),
  //   new Place(
  //     'p3',
  //     'The Foggy Palace',
  //     'Not your average city trip.',
  //     'https://images.pexels.com/photos/1059078/pexels-photo-1059078.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
  //     199.99,
  //     new Date('2019-04-15'),
  //     new Date('2019-12-18'),
  //     'abc'
  //   )
  // ]

  constructor(private authService: AuthService, private http: HttpClient) {}

  get places() {
    return this._places.asObservable();
  }

  getPlace(placeId: string) {
    let firebaseToken: string;
    return this.authService.token.pipe(
      take(1),
      switchMap(token => {
        firebaseToken = token;
        return this.places;
      }),
      take(1),
      switchMap((places: Place[]) => {
        if (places.length > 0) {
          // local places variable has data, send it back after filtering
          return of({
            ...places.find((place: Place) => place.id === placeId)
          });
        } else {
          // get the data from the firebase server
          return this.http
            .get<FirebasePlace>(
              `https://pairbnb-ionic-course.firebaseio.com/offer-places/${placeId}.json?auth=${firebaseToken}`
            )
            .pipe(
              map(place => {
                // you can throw manual error like this too!
                // if (!place) {
                //   // place will be null if invalid placeId was passed
                //   console.log('Unable to find Place with Given Id');
                //   throw new Error('Unable to find Place with Given Id');
                // } else {
                //   console.log('else block');

                // }
                // by default if anything goes wrong in creating new instance,
                // rxjs will throw error automatically
                return new Place(
                  placeId,
                  place.title,
                  place.description,
                  place.imageUrl,
                  place.serverImagePath,
                  place.resizedImageUrl,
                  place.resizedImagePath,
                  +place.price,
                  new Date(place.availableFrom),
                  new Date(place.availableTo),
                  place.location,
                  place.userId
                );
              })
            );
        }
      })
    );
  }

  fetchPlaces() {
    return this.authService.token.pipe(
      take(1),
      switchMap(token => {
        return this.http.get<{ [key: string]: FirebasePlace }>(
          `https://pairbnb-ionic-course.firebaseio.com/offer-places.json?auth=${token}`
        );
      }),
      map(responseData => {
        let places: Place[] = [];
        for (let key in responseData) {
          if (responseData.hasOwnProperty(key)) {
            places.push(
              new Place(
                key,
                responseData[key].title,
                responseData[key].description,
                responseData[key].imageUrl,
                responseData[key].serverImagePath,
                responseData[key].resizedImageUrl,
                responseData[key].resizedImagePath,
                +responseData[key].price,
                new Date(responseData[key].availableFrom),
                new Date(responseData[key].availableTo),
                responseData[key].location,
                responseData[key].userId
              )
            );
          }
        }
        // return [];
        return places;
      }),
      tap((places: Place[]) => {
        console.log(places);
        this._places.next(places);
      })
    );
  }
  // https://pairbnb-ionic-course.firebaseio.com/offer-places.json
  // {[key: string] : FirebasePlace}[]

  uploadImage(file: File) {
    const uploadData = new FormData();
    uploadData.append('image', file);
    return this.authService.token.pipe(
      take(1),
      switchMap(token => {
        return this.http.post<FirebaseImageDataResponse>(
          'https://us-central1-pairbnb-ionic-course.cloudfunctions.net/uploadFile',
          uploadData,
          { headers: { Authorization: 'Bearer ' + token } }
        );
      })
    );
  }

  deleteImage(normalImagePath: string, resizedImagePath: string) {
    return this.authService.token.pipe(
      take(1),
      switchMap(token => {
        const options = {
          headers: new HttpHeaders({
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + token
          }),
          body: {
            normal: normalImagePath,
            resized: resizedImagePath
          }
        };

        return this.http.delete(
          'https://us-central1-pairbnb-ionic-course.cloudfunctions.net/deleteImage',
          options
        );
      })
    );
  }

  addPlace(
    title: string,
    description: string,
    imageUrl: string,
    price: number,
    availableFrom: Date,
    availableTo: Date,
    location: PlaceLocation,
    serverImagePath: string,
    resizedImageUrl: string,
    resizedImagePath: string
  ) {
    let fbPlace: FirebasePlace;
    let generatedId: string;

    return this.authService.userId.pipe(
      take(1),
      switchMap((userId: string) => {
        if (!userId) {
          throw new Error('No user found');
        }
        fbPlace = {
          title,
          description,
          imageUrl,
          serverImagePath,
          resizedImageUrl,
          resizedImagePath,
          price,
          availableFrom,
          availableTo,
          location,
          userId
        };
        return this.authService.token;
      }),
      take(1),
      switchMap(token => {
        return this.http.post<{ name: string }>(
          `https://pairbnb-ionic-course.firebaseio.com/offer-places.json?auth=${token}`,
          fbPlace
        );
      }),
      switchMap(responseData => {
        generatedId = responseData.name;
        return this.places;
      }),
      take(1),
      tap((places: Place[]) => {
        const place = new Place(
          generatedId,
          fbPlace.title,
          fbPlace.description,
          fbPlace.imageUrl,
          fbPlace.serverImagePath,
          fbPlace.resizedImageUrl,
          fbPlace.resizedImagePath,
          fbPlace.price,
          fbPlace.availableFrom,
          fbPlace.availableTo,
          fbPlace.location,
          fbPlace.userId
        );
        this._places.next(places.concat(place));
      })
    );

    // return this.places.pipe(
    //   take(1),
    //   delay(1000),
    //   tap((places: Place[]) => {
    //     this._places.next(places.concat(place));
    //   })
    // );

    // this.places.pipe(take(1)).subscribe((places: Place[]) => {
    //   this._places.next(places.concat(place));
    //   console.log(places);
    // });
  }

  updatePlace(
    placeId: string,
    title: string,
    description: string,
    imageUrl: string,
    price: number,
    availableFrom: Date,
    availableTo: Date,
    location: PlaceLocation,
    serverImagePath: string,
    resizedImageUrl: string,
    resizedImagePath: string
  ) {
    let fbPlace: FirebasePlace;
    return this.authService.userId.pipe(
      take(1),
      switchMap((userId: string) => {
        fbPlace = {
          title,
          description,
          imageUrl,
          serverImagePath,
          resizedImageUrl,
          resizedImagePath,
          price,
          availableFrom,
          availableTo,
          location,
          userId
        };
        return this.authService.token;
      }),
      take(1),
      switchMap(token => {
        return this.http.put(
          `https://pairbnb-ionic-course.firebaseio.com/offer-places/${placeId}.json?auth=${token}`,
          fbPlace
        );
      }),
      switchMap(() => {
        return this.places;
      }),
      take(1),
      switchMap((places: Place[]) => {
        // in case of we reload the page and then click update
        // we check if we have places or not
        if (!places || places.length <= 0) {
          // if no place is there we first fetch from the firebase server
          return this.fetchPlaces();
        } else {
          // if place is already there we send the same places to next operator
          return of(places);
        }
      }),
      tap((places: Place[]) => {
        console.log(places, 'pppp');
        const place = new Place(
          placeId,
          title,
          description,
          imageUrl,
          serverImagePath,
          resizedImageUrl,
          resizedImagePath,
          price,
          availableFrom,
          availableTo,
          location,
          fbPlace.userId
        );
        const index = places.findIndex(pl => pl.id === placeId);
        const updatedPlaces = [...places];
        updatedPlaces[index] = place;

        // fire the next()
        this._places.next(updatedPlaces);
      })
    );
  }
}
