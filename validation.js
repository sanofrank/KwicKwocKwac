//Validation
const Joi = require('@hapi/joi');

//Login validation
const loginValidation = (data) => {
    const schema = Joi.object({
        username: Joi.string()
            .required(),
        password: Joi.string()
            .required(),
    });
    return schema.validate(data);
};

module.exports.loginValidation = loginValidation;