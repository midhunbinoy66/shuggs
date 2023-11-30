



function applyCouponDiscount(cartItems,discountType,discountAmount,maxDiscountAmount){

    // return cartItems.map(item=>{
    //     let discountedPrice = item.product.price 
    //     console.log(discountedPrice);
    //     if(discountType ==='percentage'){

    //         if(item.offerPrice){
                
    //             discountedPrice = item.offerPrice -(item.offerPrice * discountAmount)/100;
    //             console.log(discountedPrice);
                
    //         }else{
    //             discountedPrice = item.product.price - (item.product.price * discountAmount) / 100;
    //         }      

    //     }else if(discountType==='fixed'){

    //         if(item.offerPrice){
    //             discountedPrice =item.offerPrice -discountAmount;
    //         } else {
    //             discountedPrice = item.product.price - discountAmount;
    //         }
    //     }


    //     if (maxDiscountAmount && discountedPrice < item.product.price - maxDiscountAmount) {
    //         if (discountType === 'percentage') {
    //             discountedPrice = item.product.price - maxDiscountAmount;
    //         } else if (discountType === 'fixed') {
    //             discountedPrice = item.product.price - maxDiscountAmount;
    //         }
    //     }

    //     return { ...item, discountedPrice };


    // })

    return cartItems.map(item => {
        let basePrice = item.offerPrice || item.product.price;
        let discountedPrice = basePrice;

        if (discountType === 'percentage') {
            discountedPrice = basePrice - (basePrice * discountAmount) / 100;
        } else if (discountType === 'fixed') {
            discountedPrice = basePrice - discountAmount;
        }

        if (maxDiscountAmount && (basePrice - discountedPrice) > maxDiscountAmount) {
            if (discountType === 'percentage') {
                discountedPrice = basePrice - maxDiscountAmount;
            } else if (discountType === 'fixed') {
                discountedPrice = basePrice - maxDiscountAmount;
            }
        }

        return { ...item, discountedPrice };
    });



}


function calculateTotal(cartItems){
    return cartItems.reduce((sum,item)=>sum+item.discountedPrice*item.quantity,0)
}



module.exports = {
    applyCouponDiscount,
    calculateTotal
};