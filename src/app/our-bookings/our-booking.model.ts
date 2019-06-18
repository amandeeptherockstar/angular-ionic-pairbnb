export class OurBooking {
  constructor(
    public id: string,
    public placeId: string,
    public userId: string,
    public placeTitle: string,
    public placeImage: string,
    public userFirstName: string,
    public userLastName: string,
    public noOfGuests: number,
    public bookFrom: Date,
    public bookTo: Date
  ) {}
}
