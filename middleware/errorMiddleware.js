// export const errorHandler = (err, req, res, next) => {
//     console.error(err.stack || err);
//     const status = err.statusCode || 500;
//     if (req.headers.accept && req.headers.accept.includes("text/html")) {
//       return res.status(status).render("pages/error", { 
//         message: err.message || "Server Error",
//         status,
//         user: req.user || null  // pass user here
//       });
//     }
//     res.status(status).json({ message: err.message || "Server Error" });
//   };
  

// Global error handler to manage both HTML and JSON responses
export const errorHandler = (err, req, res, next) => {
    console.error(err.stack || err);
    const status = err.statusCode || 500;
   // check if request expects an HTML response (browser)
    if (req.headers.accept && req.headers.accept.includes("text/html")) {
      return res.status(status).render("pages/error", { 
        message: err.message || "Server Error",
        status,
        user: req.user || null
      });
    }
    res.status(status).json({ message: err.message || "Server Error" });
  };
  
