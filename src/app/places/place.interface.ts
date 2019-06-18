import { PlaceLocation } from './location.interface';

export interface FirebasePlace {
  title: string;
  description: string;
  imageUrl: string;
  serverImagePath: string;
  resizedImageUrl: string;
  resizedImagePath: string;
  price: number;
  availableFrom: Date;
  availableTo: Date;
  location: PlaceLocation;
  userId: string;
}
