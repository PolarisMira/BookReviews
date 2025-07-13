import express from "express";
import axios from "axios";
import pg from "pg";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

const db = new pg.Client({
    user : "postgres",
    password : "joshur161718",
    database : "ebook",
    host : "localhost",
    port : 5432
});

db.connect();

let books = [
    {
        id : 1,
        title : "Control Your Mind and Master Your Feelings asdasdasdasdasd asd asd asd asd as das das dasdasdasdasdasd",
        description : "We oftentimes look towards the outside world to find the roots of our problems. However, most of the times, we should be looking inwards.",
        isbn : "9781691706631",
        review : "Lorem ipsum dolor sit amet consectetur adipisicing elit. Repellendus veniam maiores sunt, placeat sint minus facilis est accusantium asperiores tempore non, voluptatum perferendis animi neque dicta ipsam velit praesentium accusamus",
        rating : 3,
        date : "08/07/2025"
    }
]

app.use(express.urlencoded({extended : true}));
app.use(express.static("public"));

app.get("/", async (req, res) => {
    const result = await db.query(`
                    SELECT  
                    books.id,
                    books.title,
                    books.description,
                    books.isbn_id,
                    reviews.id as reviews_id,
                    reviews.reviews,
                    reviews.rating,
                    EXTRACT(day FROM created_at) as day, 
                    EXTRACT(month FROM created_at) as month,
                    EXTRACT(year FROM created_at) as year 
                    FROM books JOIN reviews ON books.id = reviews.book_id ORDER BY id DESC`
                );
    books = result.rows;
    res.render("index.ejs", {books: books})
})

app.get("/add", (req, res) => {
    res.render("book.ejs")
})

app.post("/edit", async (req, res) => {

    console.log(req.body);

    const rating = parseInt(req.body["star-rating"]);
    const review = req.body["text-review"];
    const id = parseInt(req.body.id);

    await db.query("UPDATE reviews SET rating=$1, reviews=$2 WHERE id=$3", [rating, review, id]);

    res.redirect("/");
})

app.post("/search", async (req, res) => {

    let search = req.body.search;   
    let sort = req.body.category;

    if(search || sort) {

    if(!sort) sort = 'title';

        console.log(search, sort, " mewtwooo");

        try {
            const result = await db.query(
                `SELECT 
                 books.id,
                 books.title,
                 books.description,
                 books.isbn_id,
                 reviews.reviews,
                 reviews.rating,
                 EXTRACT(day FROM created_at) as day, 
                 EXTRACT(month FROM created_at) as month,
                 EXTRACT(year FROM created_at) as year 
                 FROM books JOIN reviews 
                 ON books.id = reviews.book_id 
                 WHERE UPPER(title) LIKE UPPER('%${search}%')
                 ORDER by ${sort} ${(sort === "rating") ? "DESC" : ""};`
            );

            books = result.rows;

            res.render("index.ejs", {books : books, search : search});
        }
        catch(err) {
            console.log(err);
            res.redirect("/");
        }
    }
    else {
        res.redirect("/");
    }
    
})

app.post("/submit-book", async (req, res) => {

    //book
    const title = req.body.title;
    const isbn = req.body.isbn;
    const description = req.body.description;

    //review
    const rating = req.body['star-rating'];
    const review = req.body.review;

    const result = await db.query(`
        INSERT INTO books 
        (title, isbn_id, description) 
        VALUES ($1, $2, $3) 
        RETURNING id
    `, [title, isbn, description]);

    const book_id = result.rows[0].id;

    await db.query(`
        INSERT INTO reviews
        (book_id, rating, reviews)
        VALUES ($1, $2, $3)
    `, [book_id, rating, review]);

    res.redirect("/");
})

app.listen(port, (err) => {
    if(err) {console.log(err);}
    else {console.log("listening to port " + port);}
})