import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

export function generateTicketPDF(booking, outputPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    doc.fontSize(20).text("Natyalok Ticket", { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text(`Booking ID: ${booking._id}`);
    doc.text(`Movie: ${booking.movie.title || booking.movie}`);
    doc.text(`ShowTime: ${booking.showTime}`);
    doc.text(`Seats: ${booking.seats.join(", ")}`);
    doc.text(`Amount: ${booking.amount || 'N/A'}`);
    doc.moveDown();
    doc.text("Enjoy the show!", { align: "center" });

    doc.end();
    stream.on("finish", () => resolve(outputPath));
    stream.on("error", (err) => reject(err));
  });
}
