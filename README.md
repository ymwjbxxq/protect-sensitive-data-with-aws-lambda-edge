# PROTECT YOUR DATA AT EDGE #

Many applications require handling sensitive data. For example, in Europe, we have GDPR that establishes rules on how companies should process personal data.
There are many ways to solve this problem, and I am sure you have seen this solution implemented in very standard practice, and that is a service in a cluster that will do some encryption.
This solution works, of course, but has few flows:

* You are encrypting sensitive data too late
* Does not scale well
* You could have a problem with logs because you need to make sure that data in the logs is also protected

### Proposal solution ###

To reduce the exposure in clear of sensitive data, you can combine AWS CloudFront with Lambda@Edge to:

* Intercept data
* Encrypt at the edge
* Pass it through before the application can process it, reducing exposure.

![picture](https://github.com/ymwjbxxq/protect-sensitive-data-with-aws-lambda-edge/blob/master/arch.png)

### NOTE ###

In this example, I have used [RSA Key Generator](https://travistidwell.com/jsencrypt/demo/), and I put the Key inside the Lambda function.
**You should use AWS KMS or AWS SSM Parameter store**

### Lambda@Edge configuration ###

* You need to create it in us-east-1
* At the moment, support node12x

### What else is needed ###

* Create an HTTP API endpoint with a route "/signup"
* Create a CloudFront distribution where the Origin Path is your HTTP API
* Add the CloudFront trigger to the Lambda Function for the #origin-request# event type

### How does it works? ###

User register to our service, and the application make a POST to your HTTP endpoint behind CloudFront
```javaScript
{
  "email": "aaaa@aaaaa.aaa",
  "family_name": "ddd",
  "given_name": "ddddd",
  "password": "superPassword"
}
```

The Lambda@Edge will intercept the request coming from CloudFront:

![picture](https://github.com/ymwjbxxq/protect-sensitive-data-with-aws-lambda-edge/blob/master/input.png)

Will decrypt the base64 "request.body.data" field, search for PII_SENSITIVE_FIELD_NAMES, and encrypt the value with the PUBLIC_KEY provided.

Once the data is replaced, it will arrive at your signup endpoint in this way:

![picture](https://github.com/ymwjbxxq/protect-sensitive-data-with-aws-lambda-edge/blob/master/receiver.png)


Inside the Signup Lambda function, you can read the "request.body" and do the following:
* Decrypt the email field with your PRIVATE_KEY
* Send an email to the user for confirmation
* Decrypt email and password and stored them as an encrypted hash for login purpose.

```javaScript
function oneWay(input: string): string {
  return crypto
    .createHash("sha256")
    .update(input)
    .digest("base64");
}

function decrypt(input: Buffer): string {
  return crypto.
    privateDecrypt({
      key: PRIVATE_KEY,
    }, input)
    .toString();
}
```

You will end up storing it, in my case DynamoDB in this way:

![picture](https://github.com/ymwjbxxq/protect-sensitive-data-with-aws-lambda-edge/blob/master/storage.png)
