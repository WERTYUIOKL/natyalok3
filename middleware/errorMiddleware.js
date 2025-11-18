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
  


export const errorHandler = (err, req, res, next) => {
    console.error(err.stack || err);
    const status = err.statusCode || 500;
    if (req.headers.accept && req.headers.accept.includes("text/html")) {
      return res.status(status).render("pages/error", { 
        message: err.message || "Server Error",
        status,
        user: req.user || null
      });
    }
    res.status(status).json({ message: err.message || "Server Error" });
  };
  