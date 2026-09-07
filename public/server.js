const express = require("express");
const path = require("path");

const app = express();

app.use(express.json());

app.use(
  express.static(
    path.join(__dirname, "public")
  )
);

const PORT =
  process.env.PORT || 3000;

const PAYSTACK_SECRET_KEY =
  process.env.PAYSTACK_SECRET_KEY;

const SITE_URL =
  process.env.SITE_URL ||
  `http://localhost:${PORT}`;


/*
  CREATE PAYMENT
*/

app.post(
  "/api/create-payment",
  async (req, res) => {

    if (!PAYSTACK_SECRET_KEY) {

      return res.status(500).json({
        error:
          "Paystack is not configured yet."
      });

    }


    const email =
      String(req.body.email || "").trim();


    if (
      !email ||
      !email.includes("@")
    ) {

      return res.status(400).json({
        error:
          "Please enter a valid email address."
      });

    }


    try {

      const response =
        await fetch(
          "https://api.paystack.co/transaction/initialize",
          {

            method: "POST",

            headers: {

              "Authorization":
                `Bearer ${PAYSTACK_SECRET_KEY}`,

              "Content-Type":
                "application/json"

            },

            body: JSON.stringify({

              email: email,

              /*
                GHS 1.00
                Paystack uses pesewas.
              */

              amount: 100,

              currency: "GHS",

              callback_url:
                `${SITE_URL}/payment-callback.html`

            })

          }
        );


      const data =
        await response.json();


      if (
        !response.ok ||
        !data.status
      ) {

        return res.status(400).json({

          error:
            data.message ||
            "Payment could not be initialized."

        });

      }


      res.json({

        authorization_url:
          data.data.authorization_url,

        reference:
          data.data.reference

      });


    } catch (error) {

      res.status(500).json({

        error:
          "Payment service error."

      });

    }

  }
);


/*
  VERIFY PAYMENT
*/

app.get(
  "/api/verify-payment/:reference",
  async (req, res) => {

    if (!PAYSTACK_SECRET_KEY) {

      return res.status(500).json({
        error:
          "Paystack is not configured."
      });

    }


    try {

      const response =
        await fetch(
          `https://api.paystack.co/transaction/verify/${encodeURIComponent(req.params.reference)}`,
          {

            headers: {

              "Authorization":
                `Bearer ${PAYSTACK_SECRET_KEY}`

            }

          }
        );


      const data =
        await response.json();


      if (
        !response.ok ||
        !data.status
      ) {

        return res.status(400).json({
          paid: false
        });

      }


      const paid =
        data.data.status === "success" &&
        data.data.currency === "GHS" &&
        Number(data.data.amount) === 100;


      res.json({
        paid: paid
      });


    } catch (error) {

      res.status(500).json({
        paid: false
      });

    }

  }
);


app.get(
  "/payment-callback.html",
  (req, res) => {

    res.sendFile(
      path.join(
        __dirname,
        "public",
        "payment-callback.html"
      )
    );

  }
);


app.listen(
  PORT,
  () => {

    console.log(
      `GAMEZONE GH running on port ${PORT}`
    );

  }
);
