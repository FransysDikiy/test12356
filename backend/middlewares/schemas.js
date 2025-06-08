const Joi = require("joi");

// --- USERS ---
const registerUserSchema = Joi.object({
    username: Joi.string().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
});

const loginUserSchema = Joi.object({
    username: Joi.string().min(3).max(30),
    email: Joi.string().email(),
    password: Joi.string().min(6).required()
}).or('username', 'email');

const logoutSchema = Joi.object({}).messages({
    "object.base": "Logout request should not contain any additional data",
});

const updateUserSchema = Joi.object({
    username: Joi.string().min(3).max(30).optional(),
    email: Joi.string().email().optional(),
    password: Joi.string().min(6).optional(),
});


// --- PETS ---
const createPetSchema = Joi.object({
    name: Joi.string().min(1).max(50).required(),
    species: Joi.string().valid('cat', 'dog', 'bird', 'other').required(),
    age: Joi.number().integer().min(0).max(100).optional(),
    weight: Joi.number().min(0).max(100).optional(),
    device: Joi.string().optional()
});

const updatePetSchema = Joi.object({
    name: Joi.string(),
    species: Joi.string(),
    age: Joi.number().integer().min(0),
    weight: Joi.number().min(0)
});

const getPetSchema = {
    params: Joi.object({
        id: Joi.string().hex().length(24).required()
    })
};


const getPetsSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
});

// --- REMINDERS ---
const createReminderSchema = Joi.object({
    pet: Joi.string().required(),
    time: Joi.string().regex(/^\d{2}:\d{2}$/).required(),
    repeat: Joi.string().valid('daily', 'weekly', 'custom').default('daily'),
    customDays: Joi.array().items(Joi.number().min(0).max(6)).optional(),
    isActive: Joi.boolean().default(true),
    syncWithGoogle: Joi.boolean().default(false)
});

// --- REMINDER LOGS ---
const createReminderLogSchema = Joi.object({
    reminder: Joi.string().hex().length(24).required(),
    status: Joi.string().valid("notified", "completed", "missed").required()
})

// --- DEVICES ---
const registerDeviceSchema = Joi.object({
    serialNumber: Joi.string().required(),
    isActive: Joi.boolean().optional()
});


module.exports = {
    registerUserSchema,
    loginUserSchema,
    logoutSchema,
    createPetSchema,
    createReminderSchema,
    registerDeviceSchema,
    updatePetSchema,
    getPetsSchema,
    getPetSchema,
    createReminderLogSchema,
    updateUserSchema
};