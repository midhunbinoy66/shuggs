const crypto = require('crypto');
const nodemailer = require('nodemailer');





const  generateRandomString = () =>{
 return  crypto.randomBytes(32).toString('hex');
}


const  sendResetEmail = (email,token) =>{

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.SMTP_USERNAME, // Your Gmail email address
          pass: process.env.SMTP_PASSWORD, // Your Gmail email password
        },
      });
      
      const mailOptions = {
        from: process.env.SMTP_USERNAME,
        to: email,
        subject: "Passord reset  link",
        text: `Your password reset link  is:https://shuggs.onrender.com/user/verifyresetpassword/${token} `,
      };
      
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error(error);
          res.status(500).json({ message: "Failed to send OTP nodemailer issue" });
        } else {
          console.log("Email sent: " + info.response);
          // res.json({ message: 'OTP sent successfully' });
          res.redirect("/api/v1/user/verification");
        }
      });
      
}


module.exports = {generateRandomString , sendResetEmail}