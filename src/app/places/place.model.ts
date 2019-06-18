import { PlaceLocation } from './location.interface';

export class Place {
  constructor(
    public id: string,
    public title: string,
    public description: string,
    public imageUrl: string,
    public serverImagePath: string,
    public resizedImageUrl: string,
    public resizedImagePath: string,
    public price: number,
    public availableFrom: Date,
    public availableTo: Date,
    public location: PlaceLocation,
    public userId: string
  ) {}
}
