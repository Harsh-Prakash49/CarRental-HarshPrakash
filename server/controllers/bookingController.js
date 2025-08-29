import Booking from "../models/Booking.js";
import Car from "../models/Car.js";


// Function to check availability  of car for a given date
const checkAvailabilty = async (car, pickupDate, returnDate)=>{
    // Logic to check availability
    const bookings = await Booking.find({
        car,
        pickupDate: { $lte: returnDate},
        returnDate: { $gte: pickupDate},
    });
    return bookings.length === 0;
}

// API to check availability of cars for the given date and location
export const checkAvailabiltyOfCar = async (req, res) => {
    try {
        const {location, pickupDate, returnDate} = req.body;

        // fetch all cars based on location
        const cars = await Car.find({location, isAvailable: true});

        // check car availability for the given date
        const availableCarsPromises = cars.map(async (car) => {
            const isAvailable = await checkAvailabilty(car._id, pickupDate, returnDate);
            return {...car._doc, isAvailable: isAvailable};
        });

        let availableCars = await Promise.all(availableCarsPromises);
        availableCars = availableCars.filter(car => car.isAvailable===true);

        res.json({success: true, availableCars});

    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message});
    }
}

// Api to create a booking
export const createBooking = async (req, res) => {
    try {
        const {_id} = req.user;
        const {car, pickupDate, returnDate} = req.body;

        const isAvailable = await checkAvailabilty(car, pickupDate, returnDate);
        if(!isAvailable){
            return res.json({success: false, message: 'Car is not available'});
        }

        const carData = await Car.findById(car);
        
        // Calculate total amount
        const picked = new Date(pickupDate);
        const returned = new Date(returnDate);
        const noOfDays = Math.ceil((returned - picked)/(1000*60*60*24));
        const price = noOfDays * carData.pricePerDay;

        await Booking.create({
            car,
            owner: carData.owner,
            user: _id,
            pickupDate,
            returnDate,
            price,
        });

        res.json({success: true, message: 'Booking created successfully'});

    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message});
    }
}

// Api to list user bookings
export const getOwnerBookings = async (req, res) => {
    try {
        if(req.user.role !== 'owner'){
            return res.json({success: false, message: 'Access denied'});
        }
        const bookings = await Booking.find({owner: req.user._id})
            .populate('car user')
            .select("-user.password")
            .sort({createdAt: -1});

            res.json({success: true, bookings});

    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message});
    }
}

//Api to get owner bookings
export const getUserBookings = async (req, res) => {
    try {
        const {_id} = req.user;
        const bookings = await Booking.find({user: _id})
            .populate('car')   
            .sort({createdAt: -1});
        res.json({success: true, bookings});
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message});
    }
}

// api to update booking status
export const changeBookingStatus = async (req, res) => {
    try {
        const {_id} = req.user;
        const {bookingId, status} = req.body;

        const booking = await Booking.findById(bookingId);

        if(booking.owner.toString() !== _id.toString()){
            return res.json({success: false, message: 'Unauthorized access'});
        }

        booking.status = status;
        await booking.save();

        res.json({success: true, message: 'Booking status updated successfully'});

    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message});
    }
}