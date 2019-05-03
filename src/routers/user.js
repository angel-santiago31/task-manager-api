const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const User = require('../models/user')
const auth = require('../middleware/auth')
const { sendWelcomeEmail, sendDeleteEmail } = require('../emails/account')
const router = new express.Router()

const upload = multer({
    limits: {
        fileSize: 1000000 // size in bytes
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/))
            return cb(new Error('Only the following formats are supported: jpg, jpeg, and png.'))

        cb(undefined, true)

        // cb(new Error('File must be a PDF')) // show error message
        // cb(undefined, true) // upload success
        // cb(undefined, false) //silently reject the upload
    }
})

const userPath = '/users'
const usersMe = `${userPath}/me`

//  CREATE USER
router.post(userPath, async (req, res) => {
    const user = new User(req.body)

    try {
        await user.save()
        sendWelcomeEmail(user.email, user.name)
        const token = await user.generateAuthToken()
        res.status(201).send({ user, token })
    } catch (e) {
        res.status(400).send(e)
    }
})

// LOGIN
router.post(`${userPath}/login`, async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({ user, token })
    } catch (e) {
        res.status(400).send(e)
    }
})

// LOGOUT
router.post(`${userPath}/logout`, auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter(token => token.token !== req.token)
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

// LOGOUT ALL
router.post(`${userPath}/logoutAll`, auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

// GET PROFILE
router.get(usersMe, auth, async (req, res) => {
    res.send(req.user)
})

// UPDATE USER
router.patch(usersMe, auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) return res.status(400).send({ error: 'Invalid updates!' })

    try {
        updates.forEach(update => req.user[update] = req.body[update])
        await req.user.save()

        // const user = await User.findByIdAndUpdate(req.params.id, req.body, {
        //     new: true, // get user after update
        //     runValidators: true // validate data 
        // })

        res.send(req.user)
    } catch (e) {
        res.status(400).send(e)
    }
})

// DELETE USER
router.delete(usersMe, auth, async (req, res) => {
    try {
        // const user = await User.findByIdAndDelete(req.user._id)
        // if (!user) return res.status(404).send()
        await req.user.remove()
        sendDeleteEmail(req.user.email, req.user.name)

        res.send(req.user)
    } catch (e) {
        res.status(500).send()
    }
})

// ADD AVATAR   
router.post(`${usersMe}/avatar`, auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})

// DELETE AVATAR
router.delete(`${usersMe}/avatar`, auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    
    res.send()
})

router.get(`${userPath}/:id/avatar`, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)

        if (!user || !user.avatar) throw new Error()
        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    } catch (e) {
        res.status(404).send()
    }
})

module.exports = router