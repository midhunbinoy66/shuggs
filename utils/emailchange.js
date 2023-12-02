const crypto = require('crypto');
const nodemailer = require('nodemailer');

const generateRandomStringForEmailChange = ()=>{
    return crypto.randomBytes(32).toString('hex');
}



const sendMailForEmailChange = (email,token)=>{
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
        text: `Your email reset token is ${token} `,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error(error);
          res.status(500).json({ message: "Failed to send OTP nodemailer issue" });
        } else {
          console.log("Email sent: " + info.response);
          // res.json({ message: 'OTP sent successfully' });
          res.redirect("/user/verification");
        }
      });

}


module.exports = {generateRandomStringForEmailChange,sendMailForEmailChange}