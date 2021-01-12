var express = require('express');
var router = express.Router();
const puppeteer = require('puppeteer');
const jsdom = require('jsdom');

router.get('/', async function (req, res, next) {
  res.send('Server UP!');
});

router.get('/asignatures', async function (req, res, next) {
  try {
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    // const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    const user = req.query.user;
    const password = req.headers.password;
    const speciality = req.query.speciality;
    await login(page, user, password, speciality);
    const asignatures = await getAsignatures(await page.goto('https://www.frc.utn.edu.ar/academico3/'));

    res.send(asignatures);
    await browser.close();
  } catch (err) {
    console.log(err);
  }
});

router.get('/califications', async function (req, res, next) {
  try {
    const response = [];
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    // const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    const user = req.query.user;
    const password = req.headers.password;
    const speciality = req.query.speciality;
    const link = req.query.link;
    const names = req.headers.names;
    const finalLink = link.replace(/ñ/g, '&');
    await login(page, user, password, speciality);
    const califications = await getCalifications(await page.goto(finalLink), names);
    response.push(califications);

    res.send(response);
    await browser.close();
  } catch (err) {
    console.log(err);
  }
});

async function login(page, user, password, speciality) {
  try {
    await page.goto('https://www.frc.utn.edu.ar/');
    await page.click('.titContorno');
    await page.waitFor(1000);
    await page.type('#lblUsuarioCompleto', `${user}`);
    await page.select('#txtDominios', `${speciality}`);
    await page.type('#pwdClave', `${password}`);
    await page.click('#btnEnviar');
    await page.waitFor(1000);
  } catch (err) {
    return 'Error: user y/o contraseña inválidos.';
  }
}

const getAsignatures = async (ag3) => {
  const body = await ag3.text();
  const {
    window: { document },
  } = new jsdom.JSDOM(body);
  const asignatures = [];
  const links = [];
  const asignaturesNodes = document.querySelectorAll('tr.clrFndInfGrilla');
  const linksNodes = document.querySelectorAll('tr.clrFndInfGrilla > td > a');
  asignaturesNodes.forEach((s) => asignatures.push(s.childNodes[5].textContent));
  linksNodes.forEach((s) =>
    links.push(
      String(s.getAttribute('onclick').slice(s.getAttribute('onclick').indexOf('aula'), s.getAttribute('onclick').indexOf(' ,') - 1))
        .split(' ')
        .join('')
    )
  );
  return {
    asignatures, links
  };
};

const getCalifications = async (ag3, names) => {
  const body = await ag3.text();
  const {
    window: { document },
  } = new jsdom.JSDOM(body);
  const califications = document.querySelectorAll('td.txtCmn > p');
  const instances = document.querySelectorAll('tr.clrFndEncGrillaDefault > td');

  const evaluationCalifications = [];
  const evaluationInstances = [];
  const nameText = document.querySelectorAll('td.tTit');
  const subNameText = nameText[1].textContent;
  let name = subNameText.slice(23, subNameText.indexOf('Espere')).trim();
  name = names.split(',').map(nameArray => nameArray.slice(0, 6) === name.slice(0, 6) ? nameArray : null)
  for (let calification of califications) {
    calification.textContent === "N/D" ? evaluationCalifications.push(".") : evaluationCalifications.push(calification.textContent);
  }
  for (let instance of instances) {
    evaluationInstances.push(instance.textContent);
  }
  return { name, evaluationInstances, evaluationCalifications };
};

module.exports = router;
