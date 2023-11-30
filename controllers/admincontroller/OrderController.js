const cutsomeAPIError = require('../../errors/customeAPIError');
const Product = require('../../models/product')
const Order = require('../../models/order');
const excel = require('exceljs');
const puppeteer = require('puppeteer');


const loadAllOrders = async (req,res)=>{
   
    const pageNumber = parseInt(req.query.page) ||1;
    const itemsPerpage = 15;
    const startIndex = (pageNumber-1)*itemsPerpage
    const totalOrdersCount  = await Order.countDocuments({});
    const totalPages = Math.ceil(totalOrdersCount/itemsPerpage)
    const orders = await Order.find({}).populate('user').skip(startIndex).limit(itemsPerpage);
    res.render('allorders',{orders,totalPages,currentPage:pageNumber});
}


const loadManageOrder  = async (req,res)=>{
    console.log('hello')
    const orderId = req.params.id;
    const order =await Order
    .findById({_id:orderId})
    .populate('products.product')
    .populate('user')
    .populate('address');
    res.render('manageorder',{order});
}

const orderStatusUpdate = async (req,res)=>{
    const orderId = req.params.id;
    const {status} =req.body;
    const order = await Order.findByIdAndUpdate({_id:orderId},{$set:{status:status}},{new:true});
    res.redirect('/api/v1/admin/allorders');
}

const productOrderStatusUpdate = async(req,res)=>{
    try {
        console.log('hi');
        const {orderStatus} = req.body;
        const productId= req.params.id;
        const orderId = req.query.orderId;
        const order = await Order.findById({_id:orderId});
        const selectedProduct = order.products.find(product=>product.product.toString()===productId)
        selectedProduct.status=orderStatus;
        await order.save();
        res.redirect(`/api/v1/admin/manageorder/${orderId}`);
    } catch (error) {
        console.log(error)
    }
}

const cancelOrder = async (req,res)=>{
    const orderId = req.params.id;
    const order = await Order.findByIdAndUpdate({_id:orderId},{$set:{status:"cancelled"}},{new:true});
    res.redirect('/api/v1/admin/allorders');
}


const loadGenerateSalesReport = async (req,res)=>{
    res.render('generatereport')
}


const getOrderData = async (req,res)=>{
    try {    
        const orders = await Order.find();

        const monthlyData =orders.reduce((acc,order)=>{
            const orderDate = order.createdAt;
            const monthYear = `${orderDate.getMonth()+1}-${orderDate.getFullYear()}`;
            
            if(!acc[monthYear]){
                acc[monthYear]=[];
            }

            acc[monthYear].push(order);
            return acc;
        },{});


        const yearlyData = orders.reduce((acc,order)=>{
            const orderDate = order.createdAt;
            const year = orderDate.getFullYear();

            if(!acc[year]){
                acc[year]=[];
            }

            acc[year].push(order);
            return acc;

        },{})


        res.json({success:true,monthlyData,yearlyData});

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}


const getSalesReportPdf = async (req,res)=>{
    try {
        const {startDate,endDate}=req.body;
        console.log(startDate,endDate);
        const newStartDate = new Date(startDate);
        const newEndDate = new Date(endDate);
        console.log(newStartDate,newEndDate);
        const orders = await Order.find({createdAt:{$gte:newStartDate,$lte:newEndDate},status:'delivered'}).populate('user').populate('products.product').populate('address');
        
        const monthlySalesOverview = orders.reduce((acc,order)=>{
            const month = order.createdAt.getMonth()+1;
            const year = order.createdAt.getFullYear();
            const monthYear = `${month}`+`-`+`${year}`;
            if(!acc[monthYear]){
                acc[monthYear]=[];
            }
            acc[monthYear].push(order)
            return acc;
        },{})

        

        const salesReportData = orders.flatMap(order=>{
          const orderInfo = {
            orderId:order._id,
            user:order.user.name,
            paymentMethod:order.payment,
            orderStatus :order.status,
          }

           return order.products.map(product=>({
            ...orderInfo,
            productName:product.product.name,
            productSize:product.size,
            productQuantity:product.quantity,
            productPrice:product.discountedPrice||product.product.price,
            total:isNaN(product.discountedPrice)?parseFloat(product.product.price *product.quantity):parseFloat(product.discountedPrice*product.quantity),
            productStatus:product.status
            
          }))

        })


    const categoryBasedSales = await Order.aggregate([
        {
            $match:{
                createdAt:{
                    $gte:newStartDate,
                    $lte:newEndDate
                },
                status:'delivered'
            }
        },
        {$unwind:'$products'},
        {
            $lookup:{
                from:'products',
                localField:'products.product',
                foreignField:'_id',
                as:'productDetails',
            }
        },
        {$unwind:'$productDetails'},
        {
            $lookup:{
                from:'categories',
                localField:'productDetails.category',
                foreignField:'_id',
                as:'productWithCategory'
            }
        },
        {$unwind:'$productWithCategory'},
        {
            $group:{
                _id:'$productWithCategory.name',
                totalSales:{
                    $sum:{$multiply:[
                        {$ifNull:['$products.discountedPrice','$productDetails.price']},
                        '$products.quantity'
                    ]}
                }
            }
        }
    ])





const brandBasedSales = await Order.aggregate([
    {
        $match:{
            createdAt:{
                $gte:newStartDate,
                $lte:newEndDate
            },
            status:'delivered'
        }
    },
    
            {$unwind:'$products'},
            {
                $lookup:{
                    from:'products',
                    localField:'products.product',
                    foreignField:'_id',
                    as:'productDetails'
                }
            },
            {$unwind:'$productDetails'},
            {
                $group:{
                    _id:'$productDetails.brand',
                    totalSales:{
                        $sum:{
                            $multiply:[
                                {$ifNull:['$products.discountedPrice','$productDetails.price']},
                                '$products.quantity'

                            ]
                        }
                    }
                }
            }
          ]);


          const genderBasedSales = await Order.aggregate([
            {
                $match:{
                    createdAt:{
                        $gte:newStartDate,
                        $lte:newEndDate
                    },
                    status:'delivered'
                }
            },
            {$unwind:'$products'},
            {
                $lookup:{
                    from:'products',
                    localField:'products.product',
                    foreignField:'_id',
                    as:'productDetails'
                }
            },
            {$unwind:'$productDetails'},
            {
               $group:{
                _id:'$productDetails.gender',
                totalSales:{
                    $sum:{
                        $multiply:[
                            {$ifNull:['$products.discountedPrice','$productDetails.price']},
                            '$products.quantity'
                        ]
                    }
                
                }
               } 
            }
          ])



const topSoldProducts = await Order.aggregate([
    {
        $match:{
            createdAt:{
                $gte:newStartDate,
                $lte:newEndDate
            },
            status:'delivered'
        }
    },
    {$unwind:'$products'},
    {
        $lookup:{
            from:'products',
            localField:'products.product',
            foreignField:'_id',
            as:'productDetails'
        }
    },
    {$unwind:'$productDetails'},
    {
        $group:{
            _id:'$products.product',
            productName: { $first: '$productDetails.name' }, // Fetching the product name
            totalQuantitySold:{
                $sum:'$products.quantity'
            }
        }
    },
    
    {
        $sort:{totalQuantitySold:-1}
    },
    {
        $limit:5
    }

])


const paymentBasedSales = await Order.aggregate([
    {
        $match:{
            createdAt:{
                $gte:newStartDate,
                $lte:newEndDate
            },
            status:'delivered'
        }
    },
    {$unwind:'$products'},
    {
        $lookup:{
            from:'products',
            localField:'products.product',
            foreignField:'_id',
            as:'productDetails'

        }
    },
    {$unwind:'$productDetails'},
    {
        $group:{
            _id:'$payment',
            totalSales:{
                $sum:{
                    $multiply:[
                        {$ifNull:['$products.discountedPrice','$productDetails.price']},
                        '$products.quantity'    
                    ]
                }
            }
        }
    }
])



const topCustomer = await Order.aggregate([
    {
        $match:{
            createdAt:{
                $gte:newStartDate,
                $lte:newEndDate
            },
            status:'delivered'
        }
    },
{$unwind:'$products'},
{$lookup:{
    from:'users',
    localField:'user',
    foreignField:'_id',
    as:'userDetails'
}},
{
$unwind:'$userDetails'
},
{
    $group:{
        '_id':'$userDetails.name',
        totalSales:{   $sum:1    }
    }
},
{
    $sort:{totalSales:-1}
}

])

        const browser = await  puppeteer.launch();
        const page = await browser.newPage();

        let content =`
        <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 20px;
          }
          h1 {
            font-size: 24px;
            margin-bottom: 10px;
          }
          h2 {
            font-size: 18px;
            margin-bottom: 10px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
            font-weight: bold;
          }
          th:first-child, td:first-child {
            width: 15%;
          }
        </style>
        <h1>Sales Report</h1>
        <table>
        <tr>
        <th>Order Id</th>
        <th>Customer</th>
        <th>Payment Method</th>
        <th>Order Status</th>
        <th>Product Name</th>
        <th>Product Size</th>
        <th>Product Quantity</th>
        <th>Product Price</th>
        <th>Total</th>
        <th>Product Status</th>
        </tr>
        `

        salesReportData.forEach(order=> {
            content +=`<tr>
                <td>${order.orderId}</td>
                <td>${order.user} </td>
                <td>${order.paymentMethod}</td>
                <td>${order.orderStatus}</td>
                <td>${order.productName}</td>
                <td>${order.productSize}</td>
                <td>${order.productQuantity}</td>
                <td>${order.productPrice}</td>
                <td>${order.total}</td>
                <td>${order.productStatus}</td>
                </tr>
                `
        });

        content += `</table>`;

        content +=`<h1>Catgory Based sales </h1>
            <table>
            <tr>
            <th>Category Id </th>
            <th>total sales </th>
            </tr>
        `
        categoryBasedSales.forEach(category => {
            content +=`<tr>
            <td>${category._id}</td>
            <td>${category.totalSales} </td>
            </tr>
            `    
        });
        content += `</table>`;

        content +=`<h1>Brand Based sales </h1>
        <table>
        <tr>
        <th>Brand </th>
        <th>total sales </th>
        </tr>
    `
    brandBasedSales.forEach(brand => {
        content +=`<tr>
        <td>${brand._id}</td>
        <td>${brand.totalSales} </td>
        </tr>
        `    
    });
    content += `</table>`;


    content +=`<h1>Gender Based sales </h1>
    <table>
    <tr>
    <th>Gender </th>
    <th>total sales </th>
    </tr>
`
genderBasedSales.forEach(gender => {
    content +=`<tr>
    <td>${gender._id}</td>
    <td>${gender.totalSales} </td>
    </tr>
    `    
});
content += `</table>`;

content +=`<h1>Top sold Products </h1>
<table>
<tr>
<th>Product </th>
<th>total Quantity </th>
</tr>
`
topSoldProducts.forEach(product => {
content +=`<tr>
<td>${product.productName}</td>
<td>${product.totalQuantitySold} </td>
</tr>
`    
});
content += `</table>`;

content +=`<h1>Payment Based Sales </h1>
<table>
<tr>
<th>Payment Method</th>
<th>Total Sales</th>
</tr>
`
paymentBasedSales.forEach(payment => {
content +=`<tr>
<td>${payment._id}</td>
<td>${payment.totalSales} </td>
</tr>
`    
});
content += `</table>`;

content +=`<h1>Top Customers </h1>
<table>
<tr>
<th>Customer Name</th>
<th>Total Sales</th>
</tr>
`
topCustomer.forEach(customer => {
content +=`<tr>
<td>${customer._id}</td>
<td>${customer.totalSales} </td>
</tr>
`    
});
content += `</table>`;

        await page.setContent(content);
        const pdfBuffer = await page.pdf({ format: 'A4' });

        await browser.close();

            
        res.setHeader('Content-Disposition',`attachment;filename="salesreport.pdf"`);
        res.setHeader('Content-Type','application/pdf')
        res.send(pdfBuffer);

    } catch (error) {
        console.log(error.message);
    }
}


const getSalesReportExcel = async(req,res)=>{
    try {

        const {startDate,endDate}=req.body;
        console.log(startDate,endDate);
        const newStartDate = new Date(startDate);
        const newEndDate = new Date(endDate);
        console.log(newStartDate,newEndDate);
        const orders = await Order.find({createdAt:{$gte:newStartDate,$lte:newEndDate},status:'delivered'}).populate('user').populate('products.product').populate('address');
        
            const salesReportData =orders.flatMap(order=>{

                const orderInfo ={
                    orderId:order._id,
                    user:order.user.name,
                    paymentMethod:order.payment,
                    orderstatus:order.status
                }
                return order.products.map(product =>({
                    ...orderInfo,
                    productName:product.product.name,
                    productSize:product.size,
                    productQuantity:product.quantity,
                    productPrice:product.discountedPrice||product.product.price,
                    total:product.discountedPrice?parseFloat(product.discountedPrice*product.quantity):parseFloat(product.product.price*product.quantity),
                    productStatus:product.status
                }))


            });



            const pendingProductsData =salesReportData.filter(order => order.productStatus==='pending');
            const cancelledProductsData = salesReportData.filter(order=>order.productStatus ==='cancelled');


            const workbook = new excel.Workbook();
            const worksheet1 = workbook.addWorksheet('salesReport');
            const worksheet2 = workbook.addWorksheet('pendingProductsData');
            const worksheet3 = workbook.addWorksheet('cancelledProductsData');



            worksheet1.columns = [
                {header:'Order ID',key:'orderId',width:25},
                {header:'Customer',key:'user',width:15},
                {header:'Payment Method',key:'paymentMethod',width:15},
                {header:'Order Status',key:'orderstatus',width:15},
                {header:'Product Name',key:'productName',width:15},
                {header:'Product size',key:'productSize',width:15},
                {header:'Product Quantity',key:'productQuantity',width:15},
                {header:'Product Price',key:'productPrice',width:15},
                {header:'Total',key:'total',width:15},
                {header:'Product Status',key:'productStatus',width:15},
                
            ];

            salesReportData.forEach(order=>{
                worksheet1.addRow(order);
            });


            worksheet2.columns = [
                {header:'Order ID',key:'orderId',width:25},
                {header:'Customer',key:'user',width:15},
                {header:'Payment Method',key:'paymentMethod',width:15},
                {header:'Order Status',key:'orderstatus',width:15},
                {header:'Product Name',key:'productName',width:15},
                {header:'Product size',key:'productSize',width:15},
                {header:'Product Quantity',key:'productQuantity',width:15},
                {header:'Product Price',key:'productPrice',width:15},
                {header:'Total',key:'total',width:15},
                {header:'Product Status',key:'productStatus',width:15},
                
            ];

            pendingProductsData.forEach(order=>{
                worksheet2.addRow(order);
            });

            worksheet3.columns = [
                {header:'Order ID',key:'orderId',width:25},
                {header:'Customer',key:'user',width:15},
                {header:'Payment Method',key:'paymentMethod',width:15},
                {header:'Order Status',key:'orderstatus',width:15},
                {header:'Product Name',key:'productName',width:15},
                {header:'Product size',key:'productSize',width:15},
                {header:'Product Quantity',key:'productQuantity',width:15},
                {header:'Product Price',key:'productPrice',width:15},
                {header:'Total',key:'total',width:15},
                {header:'Product Status',key:'productStatus',width:15},
                
            ];

            cancelledProductsData.forEach(order=>{
                worksheet3.addRow(order);
            });
         


            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename="sales-report.xlsx"');

            await workbook.xlsx.write(res);
            res.end();

    } catch (error) {
        console.log(error.message);
        res.status(500).send('internal error occurred')
    }
}




module.exports = {loadAllOrders,loadManageOrder,orderStatusUpdate,cancelOrder,getOrderData,getSalesReportExcel,getSalesReportPdf,productOrderStatusUpdate,loadGenerateSalesReport}