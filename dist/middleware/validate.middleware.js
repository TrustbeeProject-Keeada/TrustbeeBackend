// src/middleware/validate.ts
export const validate = (schema) => async (req, res, next) => {
    void res;
    try {
        // Throws error if invalid
        await schema.parseAsync({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        next(); // Valid! Continue.
    }
    catch (error) {
        next(error);
    }
};
