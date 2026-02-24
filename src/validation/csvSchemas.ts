import Joi from 'joi';

const accountNumber = Joi.string()
  .pattern(/^\d{16}$/)
  .required()
  .messages({
    'string.pattern.base': '{{#label}} must be a 16-digit number',
    'any.required': '{{#label}} is required',
  });

const dollarAmount = Joi.string()
  .pattern(/^\d+(\.\d{1,2})?$/)
  .required()
  .messages({
    'string.pattern.base': '{{#label}} must be a valid dollar amount (e.g. 1000.00)',
    'any.required': '{{#label}} is required',
  });

export const accountRowSchema = Joi.object({
  Account: accountNumber.label('Account'),
  Balance: dollarAmount.label('Balance'),
});

export const transactionRowSchema = Joi.object({
  From: accountNumber.label('From'),
  To: accountNumber.label('To'),
  Amount: dollarAmount.label('Amount'),
})
  .custom((value: { From: string; To: string }, helpers) => {
    if (value.From === value.To) {
      return helpers.error('transaction.selfTransfer');
    }
    return value;
  }, 'self-transfer check')
  .messages({
    'transaction.selfTransfer': 'From and To accounts must be different',
  });
