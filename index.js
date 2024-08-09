const bodyParser = require('body-parser');
const express = require('express');
const path = require("path");
const app = express();
const lodash = require('lodash');
const mongoose = require('mongoose');

require('dotenv').config();

const schema = new mongoose.Schema({
    name: String,
    date: Date
});

const Item = mongoose.model("Item", schema);

const ListSchema = new mongoose.Schema({
    name: String,
    items: [schema]
});

const List = mongoose.model("List", ListSchema);

const url = process.env.MONGODB; 
mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Connection is established with the database"))
    .catch((err) => console.error("Database is not connected properly", err));

let item1 = new Item({
    name: "Today I am going to picnic",
    date: new Date() 
});

let defaultItems = [item1];

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('static'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
    let today = new Date();
    Item.find({})
        .then((data) => {
            if (data.length === 0) {
                Item.insertMany(defaultItems)
                    .then(() => console.log("Document saved in database"))
                    .catch((err) => console.error('Document not saved in database', err));
                res.redirect("/");
            } else {
                res.render("list1", { ListTitle: today.toLocaleDateString("en-US", { year: "numeric", month: "numeric", day: "numeric" }), newListitem: data });
            }
        })
        .catch((err) => console.error(err));
});

app.post("/", (req, res) => {
    let name = req.body.newItem;
    let listname = req.body.list;
    let newitem = new Item({
        name: name,
        date: new Date() 
    });

    let today = new Date();
    if (listname === `${today.toLocaleDateString("en-US", { year: "numeric", month: "numeric", day: "numeric" })}`) {
        newitem.save()
            .then(() => res.redirect("/"))
            .catch((err) => console.error(err));
    } else {
        List.findOne({ name: listname })
            .then((datalist) => {
                if (datalist) {
                    datalist.items.push(newitem);
                    datalist.save()
                        .then(() => res.redirect("/" + listname))
                        .catch((err) => console.error(err));
                } else {
                    res.redirect("/"); 
                }
            })
            .catch((err) => console.error(err));
    }
});

app.get("/:ListName", (req, res) => {
    const name = lodash.capitalize(req.params.ListName);
    List.findOne({ name: name })
        .then((datalist) => {
            if (!datalist) {
                console.log("List doesn't exist");
                let list = new List({
                    name: name,
                    items: defaultItems,
                });
                list.save()
                    .then(() => res.redirect(`/${name}`))
                    .catch((err) => console.error(err));
            } else {
                console.log(datalist.name + " List Exists");
                res.render("list1", { ListTitle: datalist.name, newListitem: datalist.items });
            }
        })
        .catch((err) => console.error(err));
});

app.post("/delete", (req, res) => {
    let today = new Date();
    let deletevar = req.body.checkbox;
    let listname = req.body.listname;

    if (listname === `${today.toLocaleDateString("en-US", { year: "numeric", month: "numeric", day: "numeric" })}`) {
        Item.findByIdAndDelete(deletevar)
            .then(() => res.redirect("/"))
            .catch((err) => console.error(err));
    } else {
        List.findOneAndUpdate({ name: listname }, { $pull: { items: { _id: deletevar } } })
            .then(() => res.redirect("/" + listname))
            .catch((err) => console.error(err));
    }
});

app.listen(80, () => {
    console.log('Server is listening at port : 80');
});
