import Database from '@ioc:Adonis/Lucid/Database';
import { UserFactory } from 'Database/factories';
import test from 'japa';
import supertest from 'supertest';
import Hash from '@ioc:Adonis/Core/Hash';

const BASE_URL = `http://${process.env.HOST}:${process.env.PORT}`;

test.group('User', (group) => {
  test('it should create an user', async (assert) => {
    const userPayload = {
      email: 'teste@teste.com',
      username: 'user',
      password: '123456',
      avatar: 'https://images.com/image/100',
    };
    const { body } = await supertest(BASE_URL)
      .post('/signup')
      .send(userPayload)
      .expect(201);

    assert.exists(body.user, 'User undefined');
    assert.exists(body.user.id, 'Id undefined');
    assert.equal(body.user.email, userPayload.email);
    assert.equal(body.user.username, userPayload.username);
    assert.notExists(body.user.password, 'Password defined');
  });

  test('it should return 409 email is already in use', async (assert) => {
    const { email } = await UserFactory.create();
    const { body } = await supertest(BASE_URL)
      .post('/signup')
      .send({
        email,
        username: 'user',
        password: '123456',
      })
      .expect(409);

    assert.include(body.message, 'email');
    assert.equal(body.code, 'BAD_REQUEST');
    assert.equal(body.status, 409);
  });

  test('it should return 409 username is already in use', async (assert) => {
    const { username } = await UserFactory.create();
    const { body } = await supertest(BASE_URL)
      .post('/signup')
      .send({
        username,
        email: 'teste@teste.com',
        password: '123456',
      })
      .expect(409);

    assert.include(body.message, 'username');
    assert.equal(body.code, 'BAD_REQUEST');
    assert.equal(body.status, 409);
  });

  test('it should return 422 when required data is not provided', async (assert) => {
    const { body } = await supertest(BASE_URL)
      .post('/signup')
      .send({})
      .expect(422);
    assert.equal(body.code, 'BAD_REQUEST');
    assert.equal(body.status, 422);
  });

  test('it should return 422 when providing an invalid email', async (assert) => {
    const { body } = await supertest(BASE_URL)
      .post('/signup')
      .send({ email: 'teste', password: '123456', username: 'teste' })
      .expect(422);
    assert.equal(body.code, 'BAD_REQUEST');
    assert.equal(body.status, 422);
  });

  test('it should return 422 when providing an invalid password', async (assert) => {
    const { body } = await supertest(BASE_URL)
      .post('/signup')
      .send({ email: 'teste@teste.com', password: '123', username: 'teste' })
      .expect(422);
    assert.equal(body.code, 'BAD_REQUEST');
    assert.equal(body.status, 422);
  });

  test('it should return 422 when providing an invalid username', async (assert) => {
    const { body } = await supertest(BASE_URL)
      .post('/signup')
      .send({ email: 'teste@teste.com', password: '123456', username: 'abc' })
      .expect(422);
    assert.equal(body.code, 'BAD_REQUEST');
    assert.equal(body.status, 422);
  });

  test('it should update an user', async (assert) => {
    const { id, password } = await UserFactory.create();
    const email = 'teste@teste.com';
    const avatar = 'https://images.com/image/100';
    const { body } = await supertest(BASE_URL)
      .put(`/users/${id}`)
      .send({ email, avatar, password })
      .expect(200);

    assert.exists(body.user, 'User undefined');
    assert.equal(body.user.email, email);
    assert.equal(body.user.avatar, avatar);
    assert.equal(body.user.id, id);
  });

  test('it should update user password', async (assert) => {
    const user = await UserFactory.create();
    const password = '567890';
    const { body } = await supertest(BASE_URL)
      .put(`/users/${user.id}`)
      .send({ avatar: user.avatar, email: user.email, password })
      .expect(200);

    assert.exists(body.user, 'User undefined');
    assert.equal(body.user.id, user.id);

    await user.refresh();
    assert.isTrue(await Hash.verify(user.password, password));
  });

  group.beforeEach(async () => {
    await Database.beginGlobalTransaction();
  });
  group.afterEach(async () => {
    await Database.rollbackGlobalTransaction();
  });
});
