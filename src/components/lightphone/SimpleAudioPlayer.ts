import Argument from 'app/lib/Argument.js';

export default class SimpleAudioPlayer
{
    public static render(
        container: HTMLElement,
        getUriAsync: () => Promise<string>)
    {
        Argument.notNullOrUndefined(container, "container");
        Argument.notNullOrUndefined(getUriAsync, "getUriAsync");

        container.innerHTML = `
            <div class="simple-audio-player">
                <span class="play-button material-icons">play_arrow</span>
                <input class="seeker" type="range" />
                <audio preload="none"></audio>
            </div>
        `;

        const elements = {
            player: container.querySelector<HTMLElement>(".simple-audio-player")!,
            play: container.querySelector<HTMLElement>(".play-button")!,
            seeker: container.querySelector<HTMLInputElement>(".seeker")!,
            audio: container.querySelector<HTMLAudioElement>("audio")!,
        };

        let initialized: boolean = false;

        elements.play.addEventListener(
            "click",
            async () =>
            {
                if (elements.audio.paused)
                {
                    if (!initialized)
                    {
                        elements.audio.src = await getUriAsync();
                        initialized = true;
                    }

                    elements.play.innerHTML = "pause";
                    await elements.audio.play();
                }
                else
                {
                    elements.play.innerHTML = "play_arrow";
                    elements.audio.pause();
                }
            });
        
        elements.seeker.addEventListener(
            "change",
            () =>
            {
                if (!initialized)
                {
                    return;
                }

                elements.audio.currentTime = Number(elements.seeker.value) / 100;
            });
        
        elements.seeker.addEventListener(
            "click",
            () =>
            {
                // Seeker works as "play" button on the first click, when thumb is not displayed
                // and the audio track is not yet loaded. Once playing starts, seeker will work
                // as a seeker.
                if (initialized)
                {
                    return;
                }

                elements.play.click();
            }
        );

        elements.audio.addEventListener(
            "loadedmetadata",
            () =>
            {
                elements.seeker.value = "0";
                elements.seeker.min = "0";
                elements.seeker.max = Math.ceil(elements.audio.duration * 100).toString();

                elements.player.classList.add("loaded");
            });
        
        elements.audio.addEventListener(
            "timeupdate",
            () =>
            {
                elements.seeker.value = Math.ceil(elements.audio.currentTime * 100).toString();
            });

        elements.audio.addEventListener(
            "ended",
            () =>
            {
                elements.audio.currentTime = 0;
                elements.play.innerHTML = "play_arrow";
            });
    }
}
