import api from '@/services/api';
 
api.get('/api/users/profile')
  .then(res => console.log('Test axios profile response:', res))
  .catch(err => console.error('Test axios profile error:', err)); 