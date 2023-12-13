const pdfkit  = require('pdfkit');
const fs = require('fs');
const { jsPDF } = require('jspdf');
require('jspdf-autotable');
const User = require('../../models/user')
const Cart = require('../../models/cart');
const Product = require('../../models/product');
const Order = require('../../models/order');
const CartHistory = require('../../models/carthistory');
const Coupon = require('../../models/coupons');
const puppeteer = require('puppeteer');
const { applyCouponDiscount, calculateTotal } = require('../../utils/coupon');
const CategoryOffer = require('../../models/categoryOffers');
const ProductOffer = require('../../models/productOffer');
const Wishlist = require('../../models/wishlist');




const getCartCount = async(req,res)=>{
    try {  
        const userId = req.user.userId
        const cart = await Cart.findOne({user:userId})
        if(!cart){
           return res.json({success:true,cartItems:0})
        } 
        const cartItems = cart.items.length
        return res.json({success:true,cartCount:cartItems});
    } catch (error) {
        console.log(error.message);
        res.status(500).json({message:'internal error occured'})
    }
    
}


const getWishlistCount = async (req,res)=>{
    try {
        const userId = req.user.userId;
        const wishlist = await Wishlist.findOne({user:userId});
        
        const wishlistCount =wishlist? wishlist.items.length:0;
        res.json({success:true,wishlistCount:wishlistCount});

    } catch (error) {
        console.log(error.message);
    }
}




const loadCart = async (req, res) => {
    try {
        const userId = req.user.userId;
        const cart = await Cart.findOne({ user: userId }).populate('items.product');
        if (!cart) {
        return res.render('cart');
        }

        for(let item of cart.items ){

            item.offerPrice = await checkAllOffer(item.product); 
       }
        res.render('cart', { cart });

    } catch (error) {
        console.log(error.message);
    }
}



const addToCart = async (req, res) => {
    try {
        const userId = req.user.userId
        const productId = req.body.productId;
        const size = req.body.size;
        console.log(size);
        const quantity = "1"
        let cart = await Cart.findOne({ user: userId }).populate('items.product')
    
        if (!cart) {
            cart = new Cart({ user: userId, items: [] });
    
        }
        const product = await Product.findById({ _id: productId });
        const selectedSize = product.sizes.find(shoe => shoe.size === size);

        if (!selectedSize || selectedSize.quantity < parseInt(quantity)) {
            return res.redirect(`/user/singleproduct/${product.slug}?message='selected variant is out of stock'`);
        }

        // if (selectedSize.quantity < parseInt(quantity)) {
        //     return res.redirect(`/api/v1/user/singleproduct/${productId}?message='selected varient is out of stoke'`);
        // }


    
        // const exitsingItem = cart.items.find(item => item.product.toString() === productId && item.size.toString() === size);
        // if (exitsingItem) {
    
        //     selectedSize.quantity -= parseInt(quantity);
        //     await product.save();
    
        //     exitsingItem.quantity += parseInt(quantity)
        //     exitsingItem.size = size
    
        // } else {
        //     selectedSize.quantity -= parseInt(quantity);
        //     await product.save();
        //     cart.items.push({ product: productId, quantity: parseInt(quantity), size: size })
        // }
    
        // await cart.save();
        // res.status(200).redirect('/api/v1/user/cart')


        const existingItemIndex = cart.items.findIndex(item => item.product._id.toString() === productId && item.size === size);

        if (existingItemIndex !== -1) {
            // Update cart item quantity
            cart.items[existingItemIndex].quantity += parseInt(quantity);
        } else {
            // Add new item to cart
            cart.items.push({ product: product._id, quantity: parseInt(quantity), size: size });
        }

        // Update product quantity
        selectedSize.quantity -= parseInt(quantity);
        await product.save();

        await cart.save();
        res.status(200).redirect('/user/cart');


    } catch (error) {
        console.log(error.message);
    }

}

const editCartQuantity = async (req, res) => {
    try {
        const { userId } = req.user
        const quantity = req.body.quantity
        console.log(quantity)
        const { size } = req.query
        console.log(size)
        const productId = req.params.id;
        let cart = await Cart.findOne({ user: userId }).populate('items.product');

        const existingCartItem = cart.items.find(item => item.product._id.toString() === productId && item.size === size);

        if (!existingCartItem) {
            return res.render('cart', { cart, message: "Cart item not found" });
        }

        let product = await Product.findById({ _id: productId });
        // let selected = product.sizes.find(shoe => shoe.size === size);
        // console.log(selected);
        // if (!selected || quantity > selected.quantity) {
        //     // return   res.redirect('/api/v1/user/cart');
        //     cart = await Cart.findOneAndUpdate({ user: userId, "items.product": productId, "items.size": size }, { $set: { 'items.$.quantity': selected.quantity } }, { new: true }).populate('items.product')
        //     return res.render('cart', { cart, message: "update quantity is greater than the stock available" });
        // }
        // cart = await Cart.findOneAndUpdate({ user: userId, "items.product": productId, "items.size": size }, { $set: { 'items.$.quantity': quantity } }, { new: true }).populate('items.product')
        // res.redirect('/api/v1/user/cart');

        const selectedSize = product.sizes.find(shoe => shoe.size === size);

        // Validate quantity against product stock
        if (!selectedSize || quantity > selectedSize.quantity) {
            return res.render('cart', { cart, message: "Update quantity is greater than the available stock" });
        }

        // Update cart item quantity
        const diffQuantity = quantity - existingCartItem.quantity;
        existingCartItem.quantity = quantity;

        // Update product quantity
        selectedSize.quantity -= diffQuantity;
        await product.save();

        await cart.save();
        res.redirect('/user/cart');


    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}

const deleteCartItem = async (req, res) => {
    try {

        const productId = req.params.id
        const { userId } = req.user
        const { size, quantity } = req.query
        let cart = await Cart.findOne({ user: userId }).populate('items.product');
        await Cart.findOneAndUpdate({ user: userId }, { $pull: { items: { product: productId, size: size } } }, { new: true }).populate('items.product');
        const product = await Product.findOne({ _id: productId });
        const selectedSize = product.sizes.find(shoe => shoe.size === size);
        if (!selectedSize) {
            return res.render('cart', { cart, message: "Product variant not found" });
        }
        cart.items = cart.items.filter(item => !(item.product._id.toString() === productId && item.size === size));
        selectedSize.quantity += parseInt(quantity);
        await product.save()
        await cart.save();
        res.redirect('/user/cart');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }

}



const checkAllOffer = async (product)=>{
    try {
        const categoryOffer = await CategoryOffer.findOne({category:product.category});
    const productOffer = await ProductOffer.findOne({product:product._id});

    if(categoryOffer){
        return calculateDiscountedPrice(product.price,categoryOffer.value)
    }else if(productOffer){
        return calculateDiscountedPrice(product.price,productOffer.value)
    }else {
       return product.price; // No offer price
    }        
    } catch (error) {
     console.log(error.message);   
    }

}



const calculateDiscountedPrice = (originalPrice, discountValue) => {
    return originalPrice - (originalPrice * discountValue) / 100; // For percentage-based discount
  };




const applyCoupon = async (req, res) => {

    try {
        const { couponCode, cartItems } = req.body;

        let totalCart =0 ;
        for(let item of cartItems ){

             item.offerPrice = await checkAllOffer(item.product);
             totalCart +=item.offerPrice; 
        }
        const coupon = await Coupon.findOne({ code: couponCode });
        if (!coupon) {
            return res.json({ success: false, error: 'Invalid coupon code' })
        }

        if(totalCart<3000){
            return res.json({ success: false, error: 'coupons applicable only orders above 3000' })
        }



        const updatedCartItems = applyCouponDiscount(cartItems, coupon.discountType, coupon.discountAmount,coupon.maxDiscountAmount);
        let updatedTotal = calculateTotal(updatedCartItems);

        return res.json({ success: true, updatedTotal: updatedTotal  ,updatedCartItems: updatedCartItems});

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }

}



// const downloadInvoice = async (req,res)=>{
//     const orderId = req.params.id;
//     const order = await Order.findById({_id:orderId}).populate('user').populate('address').populate('products.product');

//     try {
//         const userName = order.user.name;
//         const useraddress = {
//             locality:order.address.locality,
//             city:order.address.city,
//             district:order.address.district,
//             state:order.address.state,
//             zipcode:order.address.zipcode
//         }
//         const products = order.products.map(product =>({
//             name:product.product.name,
//             price:product.product.price,
//             size:product.size,
//             quantity:product.quantity,
//             finalPrice:product.discountedPrice,
//             total:product.quantity*product.discountedPrice
//         }))
        
//         const orderData = {
//             orderId : order._id,
//             orderPayment : order.payment,
//             orderDate: order.createdAt,
//             orderTotal: order.products.reduce((acc,product)=>{
//                 return acc + product.discountedPrice * product.quantity;

//             },0)

//         }

//         const browser = await  puppeteer.launch();
//         const page = await browser.newPage();

//         let content =`
//         <style>
//         body {
//             font-family: Arial, sans-serif;
//             margin: 20px;
//             padding: 20px;
//             display:flex;
//             flex-direction:column;

//         }
        
//         header {
//             display: flex;
//             justify-content: space-between;
//             border-bottom: 1px solid #ccc;
//             padding: 20px;
//         }

//         h1 {
//             margin: 0;
//         }

//         .container {
//             display: grid;
//             grid-template-columns: 500px 1fr 500px;
//             column-gap: 20px;
//             row-gap: 50px;
//             padding: 20px;
//         }

//         table {
//             width: 100%;
//             border-collapse: collapse;
//             border: 2px solid black;
//         }

//         th, td {
//             border: 1px solid #ccc;
//             padding: 8px;
//             text-align: left;
//         }

//         footer {
//             margin-top:200px;
//             color: #ccc;
//             padding: 20px;
//             display:flex;
//             flex-direction:column;
//             text-align:center;
//             justify-content:center;
//         }
//         </style>
//         <body>
//         <header>
//         <div class="logo">
//         <h1>Shuggs.com </h1>
//         </div>
//         <div>
//             Tax Invoice/Bill of Supply/Cash Memo
//             (Original for Recipient)
//         </div>
//     </header>
//     <main>
//         <div class="container">
//         <div>
//         <p>Sold By:</p>
//         <p>SHUGGS MARKETING PRIVATE LIMITED</p>
//         <p>Rect/Killa Nos. 38//8/2 min, 192//22/1,196//2/1/1,</p>
//         <p>37//15/1, 15/2,, Adjacent to Starex School, Village - Vypin,</p>
//         <p>National Highway -8, Tehsil - Manesar Cochin, Kerala, 122413 IN</p>
//     </div>
//             <div ></div>
//             <div >
//             <p>Billing Address</p>
//             <p>${userName}</p>
//             <p>Locality:${useraddress.locality}</P>
//             <p>City:${useraddress.city}</P>
//             <p>District:${useraddress.district}</P>
//             <p>State:${useraddress.state}</P>
//             <p>State:${useraddress.zipcode}</P>
//             </div>
//             <div >
//                 <p>PAN No: AADCV4254H</p>
//                 <p>GST Registration No: 06AADCV4254H1ZC</p>
//             </div>
//             <div ></div>
//             <div>
//             <p>Shipping Address</p>
//             <p>${userName}</p>
//             <p>Locality:${useraddress.locality}</P>
//             <p>City:${useraddress.city}</P>
//             <p>District:${useraddress.district}</P>
//             <p>State:${useraddress.state}</P>
//             <p>State:${useraddress.zipcode}</P>
//            </div>
//         </div>

//         <div class="table-container">
//         <h5> Product Summary</h5>
//         <table>
//         <thead>
//         <tr>
//         <th>Product Name</th>
//         <th>Price</th>
//         <th>Final Price</th>
//         <th>Quantity</th>
//         <th>Total</th>
//         </tr>
//         </thead>
//         <tbody>
//         `

//         products.forEach(product => {
//             content +=`<tr>
//                 <td>${product.name}</td>
//                 <td>${product.price} </td>
//                 <td>${product.finalPrice} </td>
//                 <td>${product.quantity}</td>
//                 <td>${product.total}</td>
//                 </tr>
//                 `
//         });

//         content += `
//         <tr>
//         </tr>
//         </tbody>
//         </table>
//         <div class="table-container">
//         <table>
//         <h2> Order Summary</h2>
//         <tr>
//         <th>Order Id</th>
//         <th>Order Payment</th>
//         <th>Order Date</th>
//         <th>Order Total</th>
//         </tr>
//         <tr>
//         <td>${orderData.orderId}</td>
//         <td>${orderData.orderPayment}</td>
//         <td>${orderData.orderDate}</td>
//         <td>${orderData.orderTotal}</td>
//         </tr>
//         </table>
//         </div>
//         </div>
//         </main>
    
//         <footer>
//         <p>*ASSPL-Shuggs Seller Services Pvt. Ltd., ARIPL-Shuggs Retail India Pvt. Ltd. (only where Shuggs Retail India Pvt. Ltd. fulfillment center is co-located)</p>
//         <p>Customers desirous of availing input GST credit are requested to create a Business account and purchase on Shuggs.in/business from Business eligible offers</p>
//         <p>Please note that this invoice is not a demand for payment</p>
//     </footer>
//     </body>
//     `;


//         await page.setContent(content);
//         const pdfBuffer = await page.pdf({ format: 'A4' });

//         await browser.close();

            
//         res.setHeader('Content-Disposition',`attachment;filename="invoice_${orderId}.pdf"`);
//         res.setHeader('Content-Type','application/pdf')
//         res.send(pdfBuffer);

//     } catch (error) {
//         console.log(error.message);
//         res.status(500).send('Error generating invoice');
//     }
    

// }









const downloadInvoice = async (req, res) => {
    const orderId = req.params.id;
    const order = await Order.findById({_id: orderId}).populate('user').populate('address').populate('products.product');

    try {
        const userName = order.user.name;
        const userAddress = {
            locality: order.address.locality,
            city: order.address.city,
            district: order.address.district,
            state: order.address.state,
            zipcode: order.address.zipcode
        };
        const products = order.products.map(product => ({
            name: product.product.name,
            price: product.product.price,
            size: product.size,
            quantity: product.quantity,
            finalPrice: product.discountedPrice,
            total: product.quantity * product.discountedPrice
        }));
        
        const orderData = {
            orderId: order._id,
            orderPayment: order.payment,
            orderDate: order.createdAt,
            orderTotal: order.products.reduce((acc, product) => acc + product.discountedPrice * product.quantity, 0)
        };

        const doc = new jsPDF();
        let yOffset = 20;

        doc.setFontSize(12);

        doc.text('Shuggs.com', 105, yOffset, { align: 'center' });
        doc.text('Tax Invoice/Bill of Supply/Cash Memo (Original for Recipient)', 105, yOffset + 10, { align: 'center' });

        yOffset += 40;

        // Seller Information
        const sellerInfo = [
            'Sold By: SHUGGS MARKETING PRIVATE LIMITED',
            'Rect/Killa Nos. 38//8/2 min, 192//22/1,196//2/1/1,',
            '37//15/1, 15/2,, Adjacent to Starex School, Village - Vypin,',
            'National Highway -8, Tehsil - Manesar Cochin, Kerala, 122413 IN'
        ];
        sellerInfo.forEach(info => {
            doc.text(info, 20, yOffset);
            yOffset += 10;
        });

        yOffset += 10;

        // Billing Address
        const billingAddress = [
            `Billing Address: ${userName}`,
            `Locality: ${userAddress.locality}`,
            `City: ${userAddress.city}`,
            `District: ${userAddress.district}`,
            `State: ${userAddress.state}`,
            `Zipcode: ${userAddress.zipcode}`
        ];
        billingAddress.forEach(info => {
            doc.text(info, 20, yOffset);
            yOffset += 10;
        });

        // PAN and GST
        doc.text('PAN No: AADCV4254H', 20, yOffset);
        doc.text('GST Registration No: 06AADCV4254H1ZC', 20, yOffset + 10);

        yOffset += 30;

        // Shipping Address
        const shippingAddress = [
            `Shipping Address: ${userName}`,
            `Locality: ${userAddress.locality}`,
            `City: ${userAddress.city}`,
            `District: ${userAddress.district}`,
            `State: ${userAddress.state}`,
            `Zipcode: ${userAddress.zipcode}`
        ];
        shippingAddress.forEach(info => {
            doc.text(info, 20, yOffset);
            yOffset += 10;
        });

        yOffset += 10;

        // Product Summary Table
        doc.text('Product Summary', 20, yOffset);
        const tableColumns = ['Product Name', 'Price', 'Final Price', 'Quantity', 'Total'];
        const tableData = products.map(product => [product.name, product.price, product.finalPrice, product.quantity, product.total]);
        doc.autoTable({
            startY: yOffset + 10,
            head: [tableColumns],
            body: tableData,
            theme: 'striped',
            styles: { overflow: 'linebreak' },
        });

        // Order Summary Table
        const orderSummaryData = [
            ['Order Id', 'Order Payment', 'Order Date', 'Order Total'],
            [orderData.orderId, orderData.orderPayment, orderData.orderDate, orderData.orderTotal]
        ];
        doc.text('Order Summary', 20, doc.autoTable.previous.finalY + 20);
        doc.autoTable({
            startY: doc.autoTable.previous.finalY + 30,
            head: [orderSummaryData[0]],
            body: orderSummaryData.slice(1),
            theme: 'striped',
            styles: { overflow: 'linebreak' },
        });

        // Footer
        // const footerInfo = [
        //     '*ASSPL-Shuggs Seller Services Pvt. Ltd., ARIPL-Shuggs Retail India Pvt. Ltd. (only where Shuggs Retail India Pvt. Ltd. fulfillment center is co-located)',
        //     'Customers desirous of availing input GST credit are requested to create a Business account and purchase on Shuggs.in/business from Business eligible offers',
        //     'Please note that this invoice is not a demand for payment'
        // ];
        // footerInfo.forEach(info => {
        //     doc.text(info, 20, doc.autoTable.previous.finalY + 20);
        //     doc.autoTable.previous.finalY += 10;
        // });


        

        const footerInfo = [
            '*ASSPL-Shuggs Seller Services Pvt. Ltd., ARIPL-Shuggs Retail India Pvt. Ltd. (only where Shuggs Retail India Pvt. Ltd. fulfillment center is co-located)',
            'Customers desirous of availing input GST credit are requested to create a Business account and purchase on Shuggs.in/business from Business eligible offers',
            'Please note that this invoice is not a demand for payment'
        ];
        
        const startYOffset = doc.autoTable.previous.finalY + 20; // Initial Y offset for footer
        
        let footerYOffset = startYOffset; // Start Y offset for the footer
        
        doc.setFontSize(10); // Set font size
        
        footerInfo.forEach(info => {
            const textLines = doc.splitTextToSize(info, doc.internal.pageSize.width - 40);
            textLines.forEach(line => {
                doc.text(line, 20, footerYOffset);
                footerYOffset += 5; // Adjust vertical spacing
            });
        });
        
        // Adjust the footerYOffset if it exceeds the page height
        
        // Rest of your code...
        





        const buffer = Buffer.from(doc.output('arraybuffer'));
        const fileName = `invoice_${orderId}.pdf`;

        res.setHeader('Content-Disposition', `attachment;filename="${fileName}"`);
        res.setHeader('Content-Type', 'application/pdf');
        
        // Sending the PDF
        res.end(buffer);

    } catch (error) {
        console.log(error.message);
        res.status(500).send('Error generating invoice');
    }
};


module.exports = {
    loadCart,
    addToCart,
    editCartQuantity,
    deleteCartItem,
    applyCoupon,getCartCount,downloadInvoice,getWishlistCount
}
