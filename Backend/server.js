const express =require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('config');
const jwt = require('jsonwebtoken');

const PORT = 4000;

var Seller = require('./models/sellerModel.js');
var Vendor = require('./models/vendorModel.js');
var Item = require('./models/itemModel.js');
var Transaction = require('./models/transactionModel.js');
var Cat = require('./models/catModel.js');
var Sub_cat = require('./models/sub_catModel.js');
var Cat_request = require('./models/cat_requestModel.js');
const sellerAuth = require('./middleware/sellerAuth.js');
const vendorAuth = require('./middleware/vendorAuth.js');

app.use(bodyParser.json());
app.use(cors());

app.use('/seller/login', require('./routes/sellerAuth.js'));
app.use('/vendor/login', require('./routes/vendorAuth.js'));

mongoose.connect('mongodb://127.0.0.1:27017/WasteManagement',{useNewUrlParser: true,  useUnifiedTopology: true, useCreateIndex: true});
const connection=mongoose.connection;

connection. once('open',function(){
  console.log("Mongoose database connected");
})

///GET ALL CATEGORIES
///checked
app.get("/categories",function(req,res){
  Cat.find({}, function(err, allCategories){
    if(err){
        console.log(err);
    } else {
      var filtered=allCategories.map(category=>{
        return {
          name:category.name,
          id:category._id,
          key: category._id
        }
      })
      res.json(filtered);
    }
 });
})

///get all subcategories of a category
/// checked
app.get("/categories/:id/subcat",function(req,res){
    Cat.findById(req.params.id).populate("sub_cats").exec(function(err, result){
        if(err||!result){
          console.log(err);
        }else{
          var sub_cat=result.sub_cats;
          var final_res=sub_cat.map(subcat=>{
            return {
              key:subcat._id,
              name:subcat.name,
              quantity_type:subcat.quantity_type
            }
          });
          res.json(final_res);
        }
    });
})


/// SELLER ROUTES
///checked
app.post('/seller/signUp', function(req, res) {
  const { name, email, contact, address, password } = req.body;

  // Simple validation
  if(!name || !email || !contact || !address || !password) 
  {
    return res.status(400).json({ msg: 'Please enter all fields' });
  }

  // Check for existing user
  Seller.findOne({ email })
    .then(seller => {
      if(seller) return res.status(400).json({ msg: 'Seller with the given email already exists' });

      const newSeller = new Seller({
        name,
        email,
        contact,
        address,
        password
      });

      // Create salt & hash
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newSeller.password, salt, (err, hash) => {
          if(err) throw err;
          newSeller.password = hash;
          newSeller.save()
            .then(seller => {
              jwt.sign(
                { id: seller.id },
                config.get('jwtSecretseller'),
                { expiresIn: 3600 },
                (err, token) => {
                  if(err) throw err;
                  res.json({
                    token,
                    seller: {
                      id: seller.id,
                      name: seller.name,
                      email: seller.email,
                      contact: seller.contact,
                      address: seller.address
                    }
                  });
                }
              )
            });
        })
      })
    })
});  

//seller profile
//checked
app.get('/seller/:id', sellerAuth, function(req, res){
  Seller.findById(req.params.id).populate("items").exec(function(err, foundSeller){
    if(err)
    {
      console.log(err);
    }
    else
    {
      res.json(foundSeller);
    }
  })
})

//Items uploaded by customer
app.get('/seller/:id/items', sellerAuth, function(req, res){
    Seller.findById(req.params.id).populate("items").exec(function(err, foundSeller){
        if(err){
            console.log(err);
        }else{
          res.json(foundSeller.items);
        }
    });
})


app.post('/seller/:id/items', sellerAuth, function(req, res){
  let newItem = new Item(req.body);
  newItem['cust_id']=req.seller.id;
  console.log(newItem);
  newItem.save()
      .then(newItem => {
        res.status(200).json({newItem: 'Item added successfully by Customer'});
      })
      .catch(err => {
        res.status(400).send('adding new item failed');
      })
});

///VENDOR ROUTES
///checked
app.post('/vendor/signUp', function(req, res) {
  const { name, email, contact, address, password } = req.body;

  if(!name || !email || !contact || !address || !password) 
  {
    return res.status(400).json({ msg: 'Please enter all fields' });
  }

  // Check for existing user
  Vendor.findOne({ email })
    .then(vendor => {
      if(vendor) return res.status(400).json({ msg: 'Vendor with the given email already exists' });

      const newVendor = new Vendor({
        name,
        email,
        contact,
        address,
        password
      });

      // Create salt & hash
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newVendor.password, salt, (err, hash) => {
          if(err) throw err;
          newVendor.password = hash;
          newVendor.save()
            .then(vendor => {
              jwt.sign(
                { id: vendor.id },
                config.get('jwtSecretvendor'),
                { expiresIn: 3600 },
                (err, token) => {
                  if(err) throw err;
                  res.json({
                    token,
                    vendor: {
                      id: vendor.id,
                      name: vendor.name,
                      email: vendor.email,
                      contact: vendor.contact,
                      address: vendor.address
                    }
                  });
                }
              )
            });
        })
      })
    })
});  


//vendor profile
///checked
app.get('/vendor/:id', vendorAuth, function(req, res){
  Vendor.findById(req.params.id, function(err, foundVendor){
    if(err)
    {
      console.log(err);
    }
    else
    {
      res.json(foundVendor);
    }
  })
})

///get all items
app.get('/vendor/newsfeed', vendorAuth, function(req, res){
  Item.find({}, function(err, allItems){
    if(err)
    {
        console.log(err);
    } 
    else 
    {
      var filtered=allItems.map(item=>{
        return {
          id: item._id,
          cat_id: item.cat_id,
          sub_cat_id: item.sub_cat_id,
          quantity: item.quantity,
          image: item.image
        }
      });
      console.log(allItems);
      res.json(filtered);
    }
 });
})


///new category request
app.post('/vendor/newWasteType',vendorAuth, function(req, res){
  let request = new Cat_request(req.body);
  request.vendor_id =req.vendor.id;
  Cat.findOne({name:req.body.cat_name},function(err,category){
      if(err)
      {
        console.log(err);
      }
      else
      {
        let newSubCat = new Sub_cat({name: req.body.sub_cat_name, quantity_type: req.body.quantity_type});
        if(category)
        {
          newSubCat.save()
            .then(newSubCat => {
              category.sub_cats.push(newSubCat);
              category.save();
              request.save()
                .then(request => {
                    res.status(200).json({request: 'request and sub-category added successfully'});
                })
                .catch(err => {
                    res.status(400).send('adding new request failed');
                });
             // res.status(200).json({sub_cat: 'sub-category added successfully'});
          })
          .catch(err => {
              res.status(400).send('adding new sub-category failed');
          });
        }
        else
        {
          let newCat = new Cat({name: req.body.cat_name});
          newCat.save()
            .then(newCat => {
              newSubCat.save()
                  .then(newSubCat => {
                    newCat.sub_cats.push(newSubCat);
                    newCat.save();
                    request.save()
                      .then(request => {
                          res.status(200).json({request: 'request, category and sub-category added successfully'});
                      })
                      .catch(err => {
                          res.status(400).send('adding new request failed');
                      });
                   // res.status(200).json({sub_cat: 'sub-category and category added successfully'});
                })
                .catch(err => {
                    res.status(400).send('adding new sub-category failed');
                });
                //res.status(200).json({newCat: 'seller added successfully'});
            });
            // .catch(err => {
            //     res.status(400).send('adding new Category failed');
            // });
        }
      }
  });
});

app.listen(PORT, function(){
  console.log("Server is running on PORT: "+ PORT);
});
