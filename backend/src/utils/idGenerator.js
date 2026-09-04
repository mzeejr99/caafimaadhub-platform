const { v4: uuidv4 } = require('uuid');

function uuid() {
  return uuidv4();
}

function generateVolunteerId(sequence = Math.floor(1000 + Math.random() * 9000)) {
  const year = new Date().getFullYear();
  return `CHV-SOM-${year}-${sequence}`;
}

function generateTicketNumber(prefix = 'TCK') {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${random}`;
}

function generateReportCode(prefix = 'EMR') {
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${new Date().getFullYear()}-${random}`;
}

function generateCertificateNumber() {
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CERT-SOM-${new Date().getFullYear()}-${random}`;
}

function generateVerificationCode() {
  return 'VRF-' + Math.random().toString(36).substring(2, 10).toUpperCase();
}

function generateRequestCode(prefix = 'SR') {
  const random = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}-${new Date().getFullYear()}-${random}`;
}

module.exports = {
  uuid,
  generateVolunteerId,
  generateTicketNumber,
  generateReportCode,
  generateCertificateNumber,
  generateVerificationCode,
  generateRequestCode
};
