//Validation
const Joi = require('@hapi/joi');

//Change Password validation
const changePassValidation = (data) => {
    const schema = Joi.object({
        new_pass: Joi.string()
            .min(6)
            .required()
            .messages({
                'string.min': 'La nuova password deve contenere almeno 6 caratteri.',
                'string.empty': 'Inserisci la nuova password.'
            }),
        confirm_pass: Joi.string()
            .required()
            .valid(Joi.ref('new_pass'))
            .messages({
                'string.empty': 'Inserire nuovamente la password per conferma.',
                'any.only': `Le due password non coincidono.`
            })
    });
    return schema.validate(data);
}

//Login validation
const loginValidation = (data) => {
    const schema = Joi.object({
        username: Joi.string()
            .required()
            .messages({
                'string.empty': `Inserisci il nome utente.`
            }),
        password: Joi.string()
            .required()
            .messages({
                'string.empty': `Inserisci la password.`
            }),
    });
    return schema.validate(data);
};

//Register validation
const registerValidation = (data) => {
    const schema = Joi.object({
        name: Joi.string()
            .min(6)
            .required()
            .messages({
                'string.empty': `Il nome utente è obbligatorio.`,
                'string.min': `Il nome utente deve contenere almeno 6 caratteri.`
            }),
        email: Joi.string()
            .min(6)
            .required()
            .email()
            .messages({
                'string.empty': `L'indirizzo email è obbligatorio.`,
                'string.min': `L'indirizzo email deve contenere almeno 6 caratteri.`,
                'string.email': `L'indirizzo email deve essere valido.`
            }),
        password: Joi.string()
            .min(6)
            .required()
            .messages({
                'string.empty': `La password è obbligatoria.`,
                'string.min': `La password deve contenere almeno 6 caratteri.`
            }),
        confirmPassword: Joi.string()
            .required()
            .valid(Joi.ref('password'))
            .messages({
                'string.empty': `La riconferma della password è obbligatoria.`,
                'any.only': `La riconferma della password deve essere uguale alla password.`
            })
            });
    return schema.validate(data);
};

//Metadata validation
const metadataValidation = (data) => {
    const schema = Joi.object().options({ abortEarly: false }).keys({
        ident: Joi.string()
            .min(9)
            .max(9)
            .required()
            .messages({
                'string.min': `Il numero del documento deve contenere esattamente 3 caratteri.`,
                'string.max': `Il numero del documento deve contenere esattamente 3 caratteri.`,
                'string.empty': `Il numero del documento è obbligatorio.`
            }),
        author: Joi.string()
            .min(6)
            .required()
            .messages({
                'string.empty': `Il nome dell'autore è obbligatorio.`,
                'string.min': `Il nome dell'autore deve contenere almeno 6 caratteri.`
            }),
        role: Joi.array().items(
            Joi.string()
            .required()
            .messages({
                'string.empty': `Il ruolo dell'autore è obbligatorio.`
            })
        ),
        curator: Joi.string()
            .min(6)
            .required()
            .messages({
                'string.empty': `Il nome del ricercatore curatore del documento è obbligatorio.`
            }),
        abstract: Joi.string()
            .min(10)
            .required()
            .messages({
                'string.empty': `L'abstract del documento è obbligatorio.`,
                'string.min': `L'abstract del documento deve contenere almeno 10 caratteri.`
            }),
        doctype: Joi.array().items(
            Joi.string()
            .required()
            .messages({
                'string.empty': `La tipologia del documento è obbligatoria.`
            })
        ),
        doctopic: Joi.array().items(
            Joi.string()
            .required()
            .messages({
                'string.empty': `La tematica del documento è obbligatoria.`
            })
        ),
        docstatus: Joi.string()
            .required()
            .messages({
                'any.required': `Lo stato del documento è obbligatorio.`
            }),
        provenanceP: Joi.array().when(
            'docstatus', {
                is: 'published', 
                then: Joi.array().items(
                    Joi.string()
                    .messages({
                        'string.empty': `Almeno un riferimento bibliografico è obbligatorio.`
                    })
                )
            }).concat(Joi.array().when(
                'docstatus', {
                    is: 'unpublished', 
                    then: Joi.array().items(
                        Joi.string()
                        .messages({
                            'string.empty': `Almeno una segnatura archivistica è obbligatoria.`
                        })
                    )
                })),
        eventPlace: Joi.string().allow(''),
        eventDate: Joi.number()
            .min(1916)
            .max(1978)
            .messages({
                'number.min': `La data dell'evento deve essere un anno compreso tra il 1916 e il 1978.`,
                'number.max': `La data dell'evento deve essere un anno compreso tra il 1916 e il 1978.`,
                'number.base': `La data dell'evento deve essere un anno singolo.`
            }),
        additionalNotes: Joi.string().allow('')
    });
    return schema.validate(data, { allowUnknown: true })
}

module.exports.registerValidation = registerValidation;
module.exports.loginValidation = loginValidation;
module.exports.metadataValidation = metadataValidation;
module.exports.changePassValidation = changePassValidation;