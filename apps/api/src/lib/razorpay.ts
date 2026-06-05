import Razorpay from 'razorpay';
import { config } from './config';

let _instance: InstanceType<typeof Razorpay> | null = null;

export function getRazorpay(): InstanceType<typeof Razorpay> {
  if (!_instance) {
    _instance = new Razorpay({
      key_id:     config.RAZORPAY_KEY_ID,
      key_secret: config.RAZORPAY_KEY_SECRET,
    });
  }
  return _instance;
}
