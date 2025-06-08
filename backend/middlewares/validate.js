const validateMiddleware = (schema) => (req, res, next) => {
    try {
        const sources = ['body', 'query', 'params'];

        for (const source of sources) {
            if (schema[source]) {
                const { error } = schema[source].validate(req[source], { abortEarly: false });
                if (error) {
                    return res.status(400).json({
                        error: error.details.map((detail) => detail.message),
                    });
                }
            }
        }

        next();
    } catch (err) {
        return res.status(500).json({ error: 'Validation error' });
    }
};

module.exports = validateMiddleware;