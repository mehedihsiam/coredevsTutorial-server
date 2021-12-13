const express = require('express');
const { MongoClient } = require('mongodb');
require('dotenv').config();
const ObjectId = require('mongodb').ObjectId;
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
const bcrypt = require('bcrypt');
const fileUpload = require('express-fileupload');
const jwt = require('jsonwebtoken');
const CheckUser = require('./CheckUser');
const res = require('express/lib/response');


app.use(cors());
app.use(express.json());
app.use(fileUpload());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.84pml.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {


        await client.connect();
        console.log('DB CONNECTED')


        const database = client.db("coreDevsTutorial");
        const userCollection = database.collection('users');
        const noteCollection = database.collection('notes');
        const subscriptionCollection = database.collection('subscriptions');

        app.post('/userReg', async (req, res) => {
            const hashedPassword = await bcrypt.hash(req.body.password, 10);
            const pic = req.files.image.data;
            const encodedPic = pic.toString('base64');
            const imageBuffer = Buffer.from(encodedPic, 'base64')

            const newUser = {
                name: req.body.name,
                email: req.body.email,
                password: hashedPassword,
                image: imageBuffer
            }
            const result = await userCollection.insertOne(newUser)
            res.send(result)
        });

        app.post('/userLogin', async (req, res) => {
            try {
                const userFind = userCollection.find({ email: req.body.email });
                const user = await userFind.toArray();
                if (user && user.length > 0) {
                    const isValied = await bcrypt.compare(req.body.password, user[0].password);
                    if (isValied) {
                        console.log('success')
                        const token = jwt.sign({
                            email: user[0].email,
                            userId: user[0]._id
                        }, process.env.JWT_SIGN_CODE, {
                            expiresIn: '3h'
                        })
                        res.status(200).json({
                            "accessToken": token,
                            "messege": "Login Success"
                        });
                    }
                    else {
                        res.status(401).json({
                            "error": "Authentication Failed!"
                        })
                    }
                }
                else {
                    res.status(401).json({
                        "error": "Authentication Failed!"
                    })
                }
            }
            catch {
                res.status(401).json({
                    "error": "Authentication Failed!"
                })
            }
        })


        app.get('/users', async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const cursor = userCollection.find(query)
            const result = await cursor.toArray();
            res.send(result)
        });


        app.get('/allUsers', async (req, res) => {
            const cursor = userCollection.find({}).sort({ _id: -1 })
            const result = await cursor.toArray();
            res.send(result);
        });

        app.delete('/allUsers/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await userCollection.deleteOne(query);
            res.send(result);
        });

        app.post('/notes', async (req, res) => {
            const note = req.body;
            const result = await noteCollection.insertOne(note);
            res.send(result);
        });

        app.delete('/notes/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await noteCollection.deleteOne(query);
            res.send(result);
        });

        app.get('/notes', async (req, res) => {
            const cursor = noteCollection.find({}).sort({ _id: -1 });
            const notes = await cursor.toArray();
            res.send(notes);
        });

        app.get('/notes/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await noteCollection.findOne(query);
            res.send(result);
        });

        app.put('/notes/:id', async (req, res) => {
            const id = req.params.id;
            const noteTitle = req.body.noteTitle;
            const note = req.body.note;
            const filter = { _id: ObjectId(id) };
            const updateDoc = {
                $set: {
                    noteTitle,
                    note
                },
            };
            const result = await noteCollection.updateOne(filter, updateDoc);
            res.json(result);
        });




        app.post('/subscriptions', async (req, res) => {
            const subscription = req.body;
            const result = await subscriptionCollection.insertOne(subscription);
            res.send(result);
        });

        app.get('/subscriptions', async (req, res) => {
            const cursor = subscriptionCollection.find({}).sort({ _id: -1 });
            const result = await cursor.toArray();
            res.send(result);
        });

        app.get('/subscriptions/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await subscriptionCollection.findOne(query);
            res.send(result);
        });


    }
    finally {
        // await client.close();
    }
}

run().catch(console.dir);
app.get('/', (req, res) => {
    res.send('server is running')
})

app.listen(port, () => {
    console.log('Server is running at ', port)
})