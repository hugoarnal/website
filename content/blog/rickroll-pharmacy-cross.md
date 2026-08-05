+++
title = "Rickrolling with a Pharmacy cross"
date = 2026-09-28

[extra]
tags = [
    "c++",
    "python",
    "video",
    "hardware",
]
image = "/blog/rickroll-pharmacy-cross/pharmacy-cross.gif"
+++

## A little bit of history

If you have ever visited France, you might have seen one of these green crosses, bolted onto the building, with bright flashing colors.
It is a symbol commonly used to indicate that there is a pharmacy nearby ([symbols might vary on a country basis](https://en.wikipedia.org/wiki/Pharmacy#Symbols)). At this point, it has become a national symbol.

The pharmacy crosses can be a true business for some companies, where they make (*or resell*) crosses and implement their own control software.
However, [nothing lasts forever](https://soundcloud.com/c0ncernn/nothing-lasts-forever), and turns out that's true for pharmacies too! People retire, quit the business and whatnot.
Question is: what happens to these crosses?

Most of them can cost anywhere from 200 to 2000€ depending on the brand, so it's not unusual that these crosses eventually find themselves on the e-commerce market (ebay, leboncoin...).

About two years ago, a strong interest was given to these crosses due to a very well-produced and popular video[^1] by French youtuber Sylvqin. In this video, he explains the history behind these crosses, goes to buy one and then reverse engineers it.

## Pre-tinkering

At the start of 2026, a couple of older students at my school decided to challenge themselves too. So they bought one and completely reversed engineered it, which took them weeks. After they were successful, they organized a hackathon where we could play with the cross!

> Unfortunately, I didn't participate in the reversing process, so I cannot comment on how the cross works or any of it. If there's an article about it, let me know and I will link it here!

They gave us a [C++ library, called Lib_Croix](https://github.com/cannellegrdt/Pharmalgo-projects/tree/main/Lib_Croix), to directly interact with it. It simplified a lot of reading & writing to the cross.

There were a couple of submissions such as:
- A working [Tetris](https://github.com/cannellegrdt/Pharmalgo-projects/tree/main/Tetris)
- A [real-time editor](https://github.com/cannellegrdt/Pharmalgo-projects/tree/main/RealTimeEditor) using a Python server
- [Game Of Life](https://github.com/cannellegrdt/Pharmalgo-projects/tree/main/GameOfLife)

And the submission from my group of friends and me, a "video" player.

As you might know, a video is essentially just a collection of images put together.
So first, to display a video, we need to try and just display an image.

> [!WARNING]
> Warning: The following code was made in less than 24 hours which means it is of mediocre quality.
> If I had more time (and more energy), I would've done it probably way differently.

## Displaying a simple image

We need some information about our local cross, let's get those:
- Only taking the biggest points (middle horizontal axis X, and middle vertical axis Y), the cross is 24 LEDs wide and 24 LEDs high.
- It only supports two colors (on (green) or off)
- It has two sides (front and back)

For simplicity sake, we will convert our image from X by Y to 24 by 24 and make it monochrome. Of course, we're going to use imagemagick for that:
```sh
convert image.png -resize 24x24 -monochrome image.converted
```

That's pretty simple already, but since I don't really want to bother with C++ image handling, let's make it even simpler.
I created a python script (using [Pillow](https://pypi.org/project/pillow/)) to take all the pixels on the image and then create a text file with an `x` for white pixels and `.` for black pixels:

```py
im = Image.open(file)

rgb_im = im.convert('RGB')
width, height = rgb_im.size

# Yes, the "format" is called .pharma
with open(file.replace(".converted", ".pharma"), "w+") as f:
    for y in range(height):
        for x in range(width):
            r, g, b = rgb_im.getpixel((x, y))

            if r == 0 and g == 0 and b == 0:
                f.write(".")
            else:
                f.write("x")
        f.write("\n")
```

> [!NOTE]
> Future self note: you maybe could've just used [PPM](https://netpbm.sourceforge.net/doc/ppm.html) instead of dealing with all of that.

Last but not least, the C++ `displayImage` function (simplified for the example):
```cpp
void displayImage()
{
    // Before all of this, the lines vector has been filled with all of the lines of the image.

    // Reset the bitmap, put it all at 0
    memset(bitmap, 0, sizeof(bitmap));

    for (std::size_t y = 0; y < lines.size(); y++) {
        for (std::size_t x = 0; x < lines[y].length(); x++) {
            // That's a white pixel, lit it!
            if (lines[y][x] == 'x')
                bitmap[y][x] = 1;
        }
    }

    // Write the bitmap to the cross
    cross.writeBitmap(bitmap);
}
```

Woo! We displayed an image of the cross! (forgot to take a picture, but it was [our GitHub organization's logo](/blog/rickroll-pharmacy-cross/freaky-family.png), a remix of the [sudo sandwich logo](https://www.sudo.ws/))

Now, let's do it for a video.

## Displaying a video

Okay so, `videos == lots of images`, but how can we extract lots of images?
Thankfully, [a small software that powers a significant part of the Internet](https://xkcd.com/2347/) can help us with that ([FFmpeg](https://ffmpeg.org/)).

Let's write a quick bash script for that:
```sh
VIDEO="$1"

convert_bw_image() {
    convert $1 -resize 24x24 -monochrome $1.converted
}

convert_all_bw_images() {
    FILES=./output/*.png

    for f in $FILES; do
        convert_bw_image $f
    done
}

rm -rf output/
mkdir -p output/

ffmpeg -i $VIDEO -vf fps=10 output/out%d.png

convert_all_bw_images
```

It will create a folder `output` where all of our `.converted` monochrome files reside.
Our python script, which has been modified to include loops, will then transform those files into `.pharma` files.

Now some file sorting machinery for our C++ files collection:
```cpp
void getAllPharmaFiles()
{
    const std::string path = "output/";
    for (const auto &entry : std::filesystem::directory_iterator(path)) {
        if (hasEnding(entry.path().string(), ".pharma")) {
            pharmaFiles.push_back(entry.path().string());
        }
    }

    // In a previous version, I actually forgot to sort the files
    // It would cause all of the frames to actually be in the wrong order!
    auto compare = [](const std::string &a, const std::string &b) {
        std::regex rgx("[0-9]+");
        std::smatch match_a;
        std::smatch match_b;
        std::string a_nb, b_nb;

        if (std::regex_search(a.begin(), a.end(), match_a, rgx))
            a_nb = match_a[0];
        if (std::regex_search(b.begin(), b.end(), match_b, rgx))
            b_nb = match_b[0];
        return std::stoi(a_nb) < std::stoi(b_nb);
    };
    std::sort(pharmaFiles.begin(), pharmaFiles.end(), compare);
}
```

And then voila!

<div style="display: flex; justify-content: center">
    <video controls width="256">
        <source src="/blog/rickroll-pharmacy-cross/rickroll.mp4" type="video/mp4" />
    </video>
</div>

The final version was worth it :)

You can see if you ever come to Epitech Lyon, you should come by to see the cross as it now lives as a permanent display item in the Hub, displaying "**HUB LYON X EPITECH**".

[Click here to see the final version of the code](https://github.com/cannellegrdt/Pharmalgo-projects/tree/main/VideoPlayer) (warning: very scuffed)

---

[^1]: I highly recommend [Sylvqin's channel](https://sylvq.in) (mostly in French, might have French or English subtitles), I took a lot of inspiration from [his video](https://www.youtube.com/watch?v=ghh-28ln-z4) to write the history part of this article.
