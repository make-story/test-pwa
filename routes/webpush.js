const path = require('path'); 

const Router = require('koa-router');
const router = new Router();
const pushCtrl = require(path.resolve(__dirname, '../controllers/webpush'));

const handler = (ctx, next) => {
    ctx.body = `${ctx.request.method} ${ctx.request.path}`;
};
router.get('/', handler);
/*router.post('/', pushCtrl.create);
router.delete('/', pushCtrl.delete);
router.put('/', pushCtrl.replace);
router.patch('/', pushCtrl.update);*/

module.exports = router;