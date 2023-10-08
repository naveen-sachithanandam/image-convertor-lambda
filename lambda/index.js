var AWS =
    require('aws-sdk');
const log =
    require('lambda-log');
const util =
    require('util');
const sharp = require('sharp');

exports.handler = async function(event, context, callback) {
    var s3 = new AWS.S3();
    const ext = 'png';
    if (event.Records.Count <= 0) {
        log.info("Empty S3 Event recieved.");
        return String.Empty;
    }

    var data;
    if (event.Records && event.Records[0].eventSource === 'aws:s3') {
        srcBucket = event.Records[0].s3.bucket.name;
        srcKey = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));

        log.info("Reading to s3: " + srcKey);
        dstBucket = process.env.S3_BUCKET_OUTPUT;
        if (dstBucket === undefined) {
            dstBucket = srcBucket;
        }

        dstKey = 'convertedimage/' + srcKey + '.' + ext;
        // get the document
        data = await s3.getObject({ Bucket: srcBucket, Key: srcKey }).promise();

        log.info("Read from s3: {}. Converting to PNG", srcKey);

        var buffer;
        try {
            buffer = await sharp(data.Body).png({ palette: true }).toBuffer();
        } catch (error) {
            log.info("Error occurred :{} ", e);
        }

        log.info("uploading to s3 " + dstBucket);

        await s3.putObject({
            Bucket: dstBucket,
            Key: dstKey,
            Body: Buffer.from(buffer) /* arrayBuffer to Buffer  */ ,
            ContentType: "image"
        }).promise();
        log.info('RESULT: Success ' + dstKey); /* Log analysis regex matching */
        // Output input URL for ease of inspection
        log.info("https://s3.console.aws.amazon.com/s3/object/" + srcBucket + "/" + srcKey);
    }
};