//jshint esversion:6

const express = require("express");
//const bodyParser = require("body-parser");
const mongoose = require("mongoose");  //require mongoose
const _ = require("lodash");

//const date = require(__dirname + "/date.js");
mongoose.set('strictQuery', false); //to remove depreciation warning
const app = express();

app.set('view engine', 'ejs');

app.use(express.urlencoded({extended: true})); //new version of ejs contain bodyparser
app.use(express.static("public"));

const items = ["Buy Food", "Cook Food", "Eat Food"];
const workItems = [];
main().catch(err=>console.log(err));  //connect mongoose

async function main(){
  await mongoose.connect("mongodb://0.0.0.0:27017/todolistDB")
}

const itemsSchema = new mongoose.Schema({  //making new schema
  name:String
});
 
const Item = mongoose.model("Item",itemsSchema); //making model of the schema

const item1 = new Item({
 name:"Welcome to your todolist"
});

const item2 = new Item({
name :"Hit the + button to add new item"
});

const item3 = new  Item({
name:"<-- Hit this to delete an item"
});

const defaultItems = [item1,item2,item3];

const listSchema = new mongoose.Schema( {  //creating a new schema ListSchema
  name:String,
  items:[itemsSchema]
});

const List = mongoose.model("List",listSchema); //creating modole List for listSchema
  

app.get("/", function(req, res) {

//const day = date.getDate();

Item.find({})
.then(function(foundItems){

  if(foundItems.length===0){  //insert defaultitems if array is empty
    Item.insertMany(defaultItems)
    .then(function(){
      console.log("Successfully saved defaults item to DB");
    }).catch(function(err){
      console.log(err);
    });
    
  }else                         //else add new inserted element
    res.render("list", {listTitle: "Today", newListItems: foundItems}); 

}).catch(function(err){
  console.log(err);
});

});

app.get("/:customListName",function(req,res){  //creating a dynamic route
 const customListName = _.capitalize(req.params.customListName);

List.findOne({name:customListName},function(err,foundList){  //creating different todolist pages using dunamic route ejs
  if(!err){ 
    if(!foundList){  //if entered route does not exist create a new one
      //create a new list
      
  const list = new List({  //creating list document
    name : customListName,
    items:defaultItems
   });
   list.save();
   res.redirect("/"+customListName);  //redirect to home page to add new list page
    }else{
    
      //show the saved list
      res.render("list",{listTitle: foundList.name, newListItems: foundList.items});
    }
  }
});


});

app.post("/", function(req, res){
 
  const itemName = req.body.newItem;  //now creating new document to insert new items
  const listName = req.body.list;
  const item = new Item({
    name:itemName

  });

  if(listName === "Today"){  //if listname is home route name then simply add items here
    item.save();  //save the inserted items
  res.redirect("/");  //redirect to home page to add in the list
  }else{     //else find the inserted name and push the items in the customlist
  List.findOne({name:listName},function(err,foundList){
    foundList.items.push(item);
    foundList.save();
    res.redirect("/" + listName);
  });


  }

  
});


app.post("/delete",function(req,res){
 const checkedItemId = req.body.checkbox.trim();  //removing checked box from list
 const listName = req.body.listName;

 if(listName === "Today"){
  
 Item.findByIdAndRemove(checkedItemId,function(err){
  if(!err){
    console.log("successfully deleted checked item");
    res.redirect("/");
  }else{
    console.log(err);
  }
 });

 }else{
  List.findOneAndUpdate({name: listName},{$pull :{items:{_id:checkedItemId}}},function(err,foundList){
    if(!err){
      res.redirect("/" + listName);
    }
  });
 }
 
 
 
 

});



app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
