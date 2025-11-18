// import express from "express";
// import { confirmBooking, cancelBooking } from "../controllers/bookingController.js";
// import { protect } from "../middleware/authMiddleware.js";

// const router = express.Router();

// // Confirm booking
// router.post("/confirm", protect, confirmBooking);

// // Demo payment
// router.post("/pay-demo", protect, async (req, res) => {
//   const { movieId, seats } = req.body;
//   if (!seats || seats.length === 0) return res.status(400).json({ message: "No seats selected" });

//   setTimeout(async () => {
//     try {
//       await confirmBooking({ body: { movieId, seats }, user: req.user, io: req.io }, {
//         status: () => ({ json: () => {} }) // dummy response
//       });
//       res.status(200).json({ message: "Payment successful! Booking confirmed." });
//     } catch (err) {
//       console.error(err);
//       res.status(500).json({ message: "Booking failed after demo payment" });
//     }
//   }, 1000);
// });

// // Cancel booking
// router.delete("/cancel/:id", protect, cancelBooking);

// export default router;




import express from "express";
import { confirmBooking, cancelBooking } from "../controllers/bookingController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Confirm booking
router.post("/confirm", protect, confirmBooking);

// Demo payment
router.post("/pay-demo", protect, async (req, res) => {
  const { movieId, seats } = req.body;
  if (!seats || seats.length === 0) return res.status(400).json({ message: "No seats selected" });

  setTimeout(async () => {
    try {
      await confirmBooking(
        { body: { movieId, seats }, user: req.user, io: req.io },
        { status: () => ({ json: () => {} }) }
      );
      res.status(200).json({ message: "Payment successful! Booking confirmed." });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Booking failed after demo payment" });
    }
  }, 1000);
});

// Cancel booking
router.delete("/cancel/:id", protect, cancelBooking);

export default router;
