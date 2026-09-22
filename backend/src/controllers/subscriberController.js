const subscriberService = require('../services/subscriberService');
const { success, created, badRequest } = require('../utils/response');

class SubscriberController {
  async subscribe(req, res, next) {
    try {
      const result = await subscriberService.subscribe(req.body.email);
      return created(res, result, result.message);
    } catch (err) {
      next(err);
    }
  }

  async getSubscribers(req, res, next) {
    try {
      const { status, limit, offset } = req.query;
      const result = await subscriberService.getSubscribers({ status, limit, offset });
      return success(res, result.subscribers, 'Subscribers retrieved', 200, { total: result.total });
    } catch (err) {
      next(err);
    }
  }

  async unsubscribe(req, res, next) {
    try {
      const result = await subscriberService.unsubscribe(req.params.id);
      return success(res, result, 'Unsubscribed successfully');
    } catch (err) {
      next(err);
    }
  }

  async deleteSubscriber(req, res, next) {
    try {
      const result = await subscriberService.deleteSubscriber(req.params.id);
      return success(res, result, 'Subscriber deleted');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new SubscriberController();
